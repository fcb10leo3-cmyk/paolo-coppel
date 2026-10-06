import { Appointment, LoyaltyProfile, CreditCardItem } from '../types';

export const api = {
  async getProfile(): Promise<LoyaltyProfile> {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Error al obtener perfil');
      const data = await res.json();
      return data.profile;
    } catch (e) {
      console.warn('[API Fallback] Usando perfil local:', e);
      return {
        name: 'Carlos',
        tier: 'Navy VIP',
        punctualityScore: 100,
        creditLine: 45000,
        availableCredit: 38450,
        coppelMaxPoints: 3420,
        progressToNextTier: 78,
        purchasesNeededForGold: 2,
        memberSince: 'Marzo 2021',
        accountNumber: 'CP-9942-8842',
      };
    }
  },

  async getAppointments(): Promise<Appointment[]> {
    try {
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error('Error al obtener citas');
      const data = await res.json();
      return data.appointments;
    } catch (e) {
      console.warn('[API Fallback] Usando citas locales:', e);
      return [];
    }
  },

  async createAppointment(appointment: {
    sucursal: string;
    fecha: string;
    horario: string;
    producto: string;
    snack: string;
    notas?: string;
  }): Promise<{ success: boolean; appointment: Appointment; message: string }> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointment),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error de servidor' }));
      throw new Error(err.message || 'Error al agendar cita');
    }
    return res.json();
  },

  async cancelAppointment(id: string): Promise<boolean> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  },

  async getCards(): Promise<CreditCardItem[]> {
    try {
      const res = await fetch('/api/cards');
      if (!res.ok) throw new Error('Error al obtener tarjetas');
      const data = await res.json();
      return data.cards;
    } catch (e) {
      console.warn('[API Fallback] Usando tarjetas locales:', e);
      return [];
    }
  },

  async toggleFreezeCard(cardId: string): Promise<{ success: boolean; isFrozen: boolean; message: string }> {
    const res = await fetch(`/api/cards/${cardId}/freeze`, {
      method: 'POST',
    });
    const data = await res.json();
    return {
      success: data.success,
      isFrozen: data.card.isFrozen,
      message: data.message,
    };
  },

  async getDynamicCVV(cardId: string): Promise<{ cvv: string; expiresAt: string; secondsRemaining: number }> {
    const res = await fetch(`/api/cards/${cardId}/cvv-dynamic`);
    const data = await res.json();
    return data;
  },

  async checkoutKiosk(payload: {
    productTitle: string;
    amount: number;
    quincenas: number;
    sucursal?: string;
  }): Promise<{ success: boolean; order: any; updatedProfile: LoyaltyProfile; message: string }> {
    const res = await fetch('/api/kiosk/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Error en checkout' }));
      throw new Error(err.message || 'Error en checkout');
    }
    return res.json();
  },

  async printKioskReceipt(ticketNumber: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/kiosk/print/${ticketNumber}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getBranches(): Promise<any[]> {
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      return data.branches;
    } catch {
      return [];
    }
  },
};
