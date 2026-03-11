import { handleSupabaseError, logSupabaseOperation } from '@/lib/supabase-helpers'
import type { Profile, ProfileInsert } from '@/types/supabase'
import { normalizeNameForStorage } from '@/utils/nameFormat'
import { supabase } from '@/lib/supabase'
import { diagnostics } from '@/lib/diagnostics'

const getSupabaseClient = async () => supabase

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
  accountType: 'personal' | 'institutional'
  propertyName?: string
  propertyType?: 'haras' | 'fazenda' | 'cte' | 'central-reproducao'
}

export interface AuthUser {
  id: string
  email: string
  profile: Profile
}

class ProfileFetchError extends Error {
  constructor(message = 'Falha temporária ao carregar perfil do usuário') {
    super(message)
    this.name = 'ProfileFetchError'
  }
}

class AuthService {
  // Login com email e senha
  async login(credentials: LoginCredentials): Promise<AuthUser | null> {
    try {
      logSupabaseOperation('Login attempt', { email: credentials.email })

      const supabase = await getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (error) {
        logSupabaseOperation('Login failed', null, error)
        throw handleSupabaseError(error)
      }

      if (!data.user) {
        throw new Error('Usuário não encontrado')
      }

      // Buscar perfil do usuário
      const profile = await this.getProfile(data.user.id)
      if (!profile) {
        throw new Error('Perfil do usuário não encontrado')
      }

      // Verificar se está suspenso
      if (profile.is_suspended) {
        await this.logout()
        throw new Error('Usuário suspenso. Entre em contato com o suporte.')
      }

      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email!,
        profile
      }

      logSupabaseOperation('Login successful', { userId: authUser.id })
      return authUser

    } catch (error) {
      logSupabaseOperation('Login error', null, error)
      throw error
    }
  }

  // Registro de novo usuário
  async register(userData: RegisterData): Promise<AuthUser | null> {
    try {
      logSupabaseOperation('Register attempt', { email: userData.email })

      const supabase = await getSupabaseClient()
      // Verificar se email já existe
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', userData.email)
        .single()

      if (existingUser) {
        throw new Error('Email já cadastrado')
      }

      // Verificar se CPF já existe
      const { data: existingCpf } = await supabase
        .from('profiles')
        .select('cpf')
        .eq('cpf', userData.cpf)
        .single()

      if (existingCpf) {
        throw new Error('CPF já cadastrado')
      }

      // Verificar se está suspenso
      const isSuspended = await this.checkSuspension(userData.email, userData.cpf)
      if (isSuspended) {
        throw new Error('Usuário suspenso. Entre em contato com o suporte.')
      }

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (authError) {
        logSupabaseOperation('Auth signup failed', null, authError)
        throw handleSupabaseError(authError)
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário')
      }

      // Gerar código público
      const publicCode = await this.generatePublicCode(
        authData.user.id, 
        userData.accountType
      )

      // Criar perfil
      const profileData: ProfileInsert = {
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        account_type: userData.accountType,
        property_name: normalizeNameForStorage(userData.propertyName),
        property_type: userData.propertyType,
        property_id: userData.accountType === 'institutional' ? authData.user.id : null,
        public_code: publicCode,
        plan: 'free'
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        logSupabaseOperation('Profile creation failed', null, profileError)
        // Limpar usuário do auth se perfil falhou
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw handleSupabaseError(profileError)
      }

      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email!,
        profile: profile as Profile
      }

      logSupabaseOperation('Register successful', { userId: authUser.id })
      return authUser

    } catch (error) {
      logSupabaseOperation('Register error', null, error)
      throw error
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      const supabase = await getSupabaseClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw handleSupabaseError(error)
      }
      logSupabaseOperation('Logout successful')
    } catch (error) {
      logSupabaseOperation('Logout error', null, error)
      throw error
    }
  }

  // Obter usuário atual
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      diagnostics.debug('auth-service', 'getCurrentUser started');
      const supabase = await getSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        diagnostics.debug('auth-service', 'getCurrentUser resolved without user');
        return null
      }

      const profile = await this.getProfile(user.id)
      if (!profile) {
        // Evita oscilação user -> null -> user quando o Auth já existe,
        // mas o profile falha temporariamente ao reidratar.
        throw new ProfileFetchError('Perfil indisponível temporariamente')
      }

      diagnostics.debug('auth-service', 'getCurrentUser resolved with profile', { userId: user.id });
      return {
        id: user.id,
        email: user.email!,
        profile
      }
    } catch (error) {
      logSupabaseOperation('Get current user error', null, error)
      throw error
    }
  }

  // Obter perfil do usuário
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Perfil não encontrado
        }
        throw new ProfileFetchError(handleSupabaseError(error).message)
      }

      return data as Profile
    } catch (error) {
      logSupabaseOperation('Get profile error', null, error)
      if (error instanceof ProfileFetchError) {
        throw error
      }
      throw new ProfileFetchError()
    }
  }

  // Atualizar perfil
  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw handleSupabaseError(error)
      }

      logSupabaseOperation('Profile updated', { userId })
      return data as Profile
    } catch (error) {
      logSupabaseOperation('Update profile error', null, error)
      throw error
    }
  }

  // 🔒 Verificar suspensão (protegido contra SQL injection)
  async checkSuspension(email: string, cpf: string): Promise<boolean> {
    try {
      const supabase = await getSupabaseClient()
      // Validar inputs
      if (!email || !cpf) return false;

      // 🔒 Usar queries separadas ao invés de .or() com concatenação
      const { data: emailSuspension, error: emailError } = await supabase
        .from('suspensions')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .maybeSingle();

      if (emailError) {
        throw handleSupabaseError(emailError);
      }

      if (emailSuspension) return true;

      const { data: cpfSuspension, error: cpfError } = await supabase
        .from('suspensions')
        .select('*')
        .eq('cpf', cpf)
        .eq('is_active', true)
        .maybeSingle();

      if (cpfError) {
        throw handleSupabaseError(cpfError);
      }

      return !!cpfSuspension;
    } catch (error) {
      logSupabaseOperation('Check suspension error', null, error);
      return false;
    }
  }

  // Gerar código público
  async generatePublicCode(userId: string, accountType: string): Promise<string> {
    try {
      const supabase = await getSupabaseClient()
      const { data, error } = await supabase
        .rpc('generate_public_code', {
          user_id_param: userId,
          account_type_param: accountType
        })

      if (error) {
        throw handleSupabaseError(error)
      }

      return data as string
    } catch (error) {
      logSupabaseOperation('Generate public code error', null, error)
      // Fallback: gerar código simples
      const prefix = accountType === 'institutional' ? 'H' : 'U'
      const userCode = userId.slice(-6).toUpperCase()
      const year = new Date().getFullYear().toString().slice(-2)
      return `${prefix}${userCode}${year}`
    }
  }

  // Listener para mudanças de autenticação
  async onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = await getSupabaseClient()
    return supabase.auth.onAuthStateChange(async (event, session) => {
      logSupabaseOperation('Auth state change', { event })
      diagnostics.info('auth-service', 'onAuthStateChange event', {
        event,
        hasSession: Boolean(session),
        expiresAt: session?.expires_at ?? null
      });
      
      if (session?.user) {
        try {
          // Timeout de 10s no getProfile para nunca deixar o callback pendente.
          const profile = await Promise.race([
            this.getProfile(session.user.id),
            new Promise<never>((_, reject) =>
              window.setTimeout(
                () => reject(new Error('getProfile timeout no auth listener (10s)')),
                10_000
              )
            )
          ])
          if (profile) {
            callback({
              id: session.user.id,
              email: session.user.email!,
              profile
            })
            return
          }

          console.warn('[AuthService] Sessão ativa sem perfil carregado. Mantendo usuário atual até nova tentativa.')
        } catch (error) {
          console.warn('[AuthService] Falha/timeout ao carregar perfil após evento de auth. Mantendo usuário atual.', error)
          // NÃO chama callback(null) aqui — preserva o estado do usuário no AuthContext.
        }
      } else {
        callback(null)
      }
    })
  }
}

export const authService = new AuthService()

