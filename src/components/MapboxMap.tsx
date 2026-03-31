import React, { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Profile } from '@/types/supabase';

// Você deve adicionar sua chave da API do Mapbox aqui
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiY2F2YWxhcmlhZGlnaXRhbCIsImEiOiJjbTJwdGNyZGcwMDNiMmxzY2k5ZDVzMGFzIn0.example';

// Configurar o token do Mapbox
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

interface MapboxMapProps {
  users: Profile[];
  onUserClick?: (user: Profile) => void;
  className?: string;
}

interface UserMarker {
  user: Profile;
  marker: mapboxgl.Marker;
  element: HTMLElement;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ users, onUserClick, className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<UserMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Função para criar elemento do marcador personalizado
  const createMarkerElement = useCallback((user: Profile): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'user-marker';
    
    // Estilo base do marcador
    el.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 3px solid white;
    `;

    // Verificar se é usuário VIP ou free
    const isVip = user.plan !== 'free';
    
    if (isVip && user.avatar_url) {
      // Usuário VIP com logo personalizada
      const img = document.createElement('img');
      img.src = user.avatar_url;
      img.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      `;
      img.onerror = () => {
        // Fallback para avatar padrão se a imagem falhar
        el.innerHTML = '';
        el.style.background = 'linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%)';
        el.innerHTML = `<span style="color: white; font-weight: bold; font-size: 18px;">${user.name.charAt(0).toUpperCase()}</span>`;
      };
      el.appendChild(img);
      
      // Adicionar coroa para usuários VIP
      const crown = document.createElement('div');
      crown.innerHTML = '👑';
      crown.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        font-size: 16px;
        background: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      `;
      el.appendChild(crown);
    } else {
      // Usuário free com avatar padrão
      el.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
      el.innerHTML = `<span style="color: white; font-weight: bold; font-size: 18px;">${user.name.charAt(0).toUpperCase()}</span>`;
    }

    // Efeitos hover
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.1)';
      el.style.zIndex = '1000';
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.zIndex = '1';
    });

    // Click handler
    el.addEventListener('click', () => {
      if (onUserClick) {
        onUserClick(user);
      }
    });

    return el;
  }, [onUserClick]);

  // Função para geocodificar cidade/país para coordenadas
  const geocodeLocation = async (location: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return [lng, lat];
      }
      return null;
    } catch (error) {
      console.error('Erro na geocodificação:', error);
      return null;
    }
  };

  // Inicializar o mapa
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Estilo similar ao FoundersAround
      center: [-54.5, -15.5], // Centro do Brasil
      zoom: 4,
      projection: 'globe', // Projeção globo como no FoundersAround
    });

    // Configurações do globo
    map.current.on('style.load', () => {
      if (map.current) {
        map.current.setFog({
          color: 'rgb(186, 210, 235)', // Cor do fog
          'high-color': 'rgb(36, 92, 223)', // Cor do espaço
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6,
        });
        setMapLoaded(true);
      }
    });

    // Controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Adicionar marcadores dos usuários
  useEffect(() => {
    if (!map.current || !mapLoaded || !users.length) return;

    // Limpar marcadores existentes
    markers.current.forEach(({ marker }) => marker.remove());
    markers.current = [];

    // Adicionar novos marcadores
    users.forEach(async (user) => {
      // Construir localização baseada nos dados do perfil
      // Prioridade: cidade/estado/país > propriedade > padrão
      let location = 'Salvador, Brasil'; // Padrão
      
      if (user.city && user.state && user.country) {
        // Usar localização completa do perfil
        location = `${user.city}, ${user.state}, ${user.country}`;
      } else if (user.city && user.country) {
        // Usar cidade e país
        location = `${user.city}, ${user.country}`;
      } else if (user.property_name) {
        // Fallback para nome da propriedade
        location = `${user.property_name}, Brasil`;
      }
      
      const coordinates = await geocodeLocation(location);
      
      if (coordinates) {
        const [lng, lat] = coordinates;
        
        // Adicionar pequena variação aleatória para evitar sobreposição
        // na mesma cidade (múltiplos usuários da mesma localização)
        const randomOffset = 0.05; // Offset menor para precisão
        const offsetLng = lng + (Math.random() - 0.5) * randomOffset;
        const offsetLat = lat + (Math.random() - 0.5) * randomOffset;
        
        const markerElement = createMarkerElement(user);
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([offsetLng, offsetLat])
          .addTo(map.current!);

        markers.current.push({
          user,
          marker,
          element: markerElement,
        });
      }
    });
  }, [users, mapLoaded, createMarkerElement]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: '500px' }}
      />
      
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-100 rounded-xl flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600">Carregando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapboxMap;
