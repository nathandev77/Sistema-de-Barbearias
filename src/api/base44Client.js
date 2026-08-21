// ============================================================
// Base44 API Client - Conexão Real com o Backend
// Todas as entidades conectadas ao backend Node.js/Prisma
// ============================================================
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const getToken = () => localStorage.getItem('base44_token') || localStorage.getItem('base44_client_token');

export async function fetchApi(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
        let errorMsg = 'Erro na requisição da API';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
            if (errorData.details && Array.isArray(errorData.details)) {
                errorMsg += ': ' + errorData.details.map(d => `${d.path}: ${d.message}`).join(', ');
            }
        } catch (e) {}
        throw new Error(errorMsg);
    }

    if (response.status === 204) {
        return null;
    }
    return response.json();
}

// ─── HELPERS DE MAPEAMENTO ────────────────────────────────────────────────────

const mapBarberFromBackend = (b) => ({
    ...b,
    is_active: b.isActive,
    compensation_type: b.compensationType,
    commission_pct: b.commissionPct,
    fixed_salary: b.fixedSalary,
    created_date: b.createdAt,
    workStart: b.workStart,
    workEnd: b.workEnd,
    lunchStart: b.lunchStart,
    lunchEnd: b.lunchEnd
});

const mapBarberToBackend = (data) => ({
    name: data.name,
    phone: data.phone || undefined,
    specialty: data.specialty || undefined,
    compensationType: data.compensation_type || 'both',
    commissionPct: data.commission_pct ? Number(data.commission_pct) : 0,
    fixedSalary: data.fixed_salary ? Number(data.fixed_salary) : null,
    isActive: data.is_active !== undefined ? data.is_active : true,
    notes: data.notes || undefined,
    workStart: data.workStart || '09:00',
    workEnd: data.workEnd || '18:00',
    lunchStart: data.lunchStart || undefined,
    lunchEnd: data.lunchEnd || undefined
});

// ─── ENTIDADES ────────────────────────────────────────────────────────────────

// BARBEIROS
export const Barber = {
    async list() {
        const data = await fetchApi('/barbers');
        return data.map(mapBarberFromBackend);
    },
    async create(data) {
        const result = await fetchApi('/barbers', {
            method: 'POST',
            body: JSON.stringify(mapBarberToBackend(data))
        });
        return mapBarberFromBackend(result);
    },
    async update(id, data) {
        const result = await fetchApi(`/barbers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(mapBarberToBackend(data))
        });
        return mapBarberFromBackend(result);
    },
    async delete(id) {
        await fetchApi(`/barbers/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// CLIENTES DA BARBEARIA (aba Clientes no painel admin)
export const Client = {
    async list() {
        return fetchApi('/clients');
    },
    async create(data) {
        return fetchApi('/clients', {
            method: 'POST',
            body: JSON.stringify({
                name: data.name,
                phone: data.phone || undefined,
                email: data.email || undefined,
                notes: data.notes || undefined,
            })
        });
    },
    async update(id, data) {
        return fetchApi(`/clients/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: data.name,
                phone: data.phone || undefined,
                email: data.email || undefined,
                notes: data.notes || undefined,
            })
        });
    },
    async delete(id) {
        await fetchApi(`/clients/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// SERVIÇOS
export const Service = {
    async list() {
        return fetchApi('/services');
    },
    async create(data) {
        return fetchApi('/services', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/services/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// AGENDAMENTOS
export const Appointment = {
    async list(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return fetchApi(`/appointments${params ? `?${params}` : ''}`);
    },
    async getAvailableSlots(barberId, date) {
        return fetchApi(`/appointments/available-slots?barberId=${barberId}&date=${date}`);
    },
    async create(data) {
        return fetchApi('/appointments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/appointments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/appointments/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// PRODUTOS
export const Product = {
    async list() {
        return fetchApi('/products');
    },
    async create(data) {
        return fetchApi('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/products/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// VENDAS
export const Sale = {
    async list() {
        return fetchApi('/sales');
    },
    async create(data) {
        return fetchApi('/sales', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/sales/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/sales/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// DESPESAS
export const Expense = {
    async list() {
        return fetchApi('/expenses');
    },
    async create(data) {
        return fetchApi('/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/expenses/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// ASSINATURAS
export const Subscription = {
    async create(data) {
        return fetchApi('/plans/subscribe', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async updateStatus(id, status) {
        return fetchApi(`/plans/subscriptions/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },
    async delete(id) {
        await fetchApi(`/plans/subscriptions/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

// RESERVAS DE PRODUTOS
export const ProductReservation = {
    async list(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return fetchApi(`/product-reservations${params ? `?${params}` : ''}`);
    },
    async create(data) {
        return fetchApi('/product-reservations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    async update(id, data) {
        return fetchApi(`/product-reservations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    async delete(id) {
        await fetchApi(`/product-reservations/${id}`, { method: 'DELETE' });
        return { success: true };
    }
};

export const Barbershop = {
    async list() { return []; },
    async get(id) { return null; },
};

// ─── AUTHENTICATION ───────────────────────────────────────────────────────────

const AUTH_ADMIN_KEY = 'base44_auth_admin';

export const auth = {
    async getAdminUser() {
        const raw = localStorage.getItem(AUTH_ADMIN_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    async loginAdmin(email, password) {
        const data = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.mustChangePassword) {
            return {
                mustChangePassword: true,
                email: data.email || email,
                message: data.message || 'Primeiro acesso detectado. É obrigatório criar sua nova senha.'
            };
        }

        localStorage.setItem('base44_token', data.token);

        const userToStore = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.name,
            role: data.user.role.toLowerCase(),
            barbershop: data.barbershop
        };

        localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(userToStore));
        return userToStore;
    },

    async registerTrial({ barbershopName, email, phone }) {
        const data = await fetchApi('/auth/register-trial', {
            method: 'POST',
            body: JSON.stringify({ barbershopName, email, phone })
        });
        return data;
    },

    async firstAccessChangePassword({ email, tempPassword, newPassword }) {
        const data = await fetchApi('/auth/first-access-password', {
            method: 'POST',
            body: JSON.stringify({ email, tempPassword, newPassword })
        });

        localStorage.setItem('base44_token', data.token);

        const userToStore = {
            id: data.user.id,
            email: data.user.email,
            full_name: data.user.name,
            role: data.user.role.toLowerCase(),
            barbershop: data.barbershop
        };

        localStorage.setItem(AUTH_ADMIN_KEY, JSON.stringify(userToStore));
        return userToStore;
    },

    async logoutAdmin() {
        localStorage.removeItem(AUTH_ADMIN_KEY);
        localStorage.removeItem('base44_token');
    },

    // Portal do Cliente — usa JWT específico do portal
    async getClientUser() {
        const raw = localStorage.getItem('base44_auth_client');
        return raw ? JSON.parse(raw) : null;
    },

    async loginClient(email, password, barbershopId, barbershopSlug) {
        // Usa a rota específica do portal para autenticar clientes da barbearia
        const response = await fetch(`${API_URL}/portal/${barbershopSlug}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Credenciais inválidas.');

        localStorage.setItem('base44_client_token', data.token);
        const clientToStore = {
            id: data.client.id,
            email: data.client.email,
            full_name: data.client.name,
            role: 'client',
            barbershopSlug,
            barbershopId: data.barbershop.id,
        };
        localStorage.setItem('base44_auth_client', JSON.stringify(clientToStore));
        return clientToStore;
    },

    async logoutClient() {
        localStorage.removeItem('base44_auth_client');
        localStorage.removeItem('base44_client_token');
    }
};

export default { Barbershop, Client, Service, Appointment, Barber, Product, ProductReservation, Sale, Expense, Subscription, auth };
