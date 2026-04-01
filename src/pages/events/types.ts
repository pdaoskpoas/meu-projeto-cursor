export interface EventDetailsEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  max_participants: number | null;
  registration_deadline: string | null;
  cover_image_url: string | null;
  organizer_id: string | null;
  is_boosted: boolean;
  ad_status: string;
  published_at: string;
  organizer_name?: string;
  organizer_property?: string;
  organizer_email?: string;
  organizer_public_code?: string | null;
  promotora?: string | null;
  organizadora?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
}

export interface EventListItem {
  id: string;
  title: string;
  event_type: string | null;
  start_date: string;
  end_date: string | null;
  city: string | null;
  state: string | null;
  cover_image_url: string | null;
}
