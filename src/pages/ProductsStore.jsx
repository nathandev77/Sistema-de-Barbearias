import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Product, Barber, Sale, ProductReservation } from '@/api/base44Client';
import { TypingText } from '@/components/animate-ui/primitives/texts/typing';
import { Tabs, TabsContent, TabsContents, TabsHighlight, TabsHighlightItem, TabsList, TabsTrigger } from '@/components/animate-ui/primitives/animate/tabs';
import { Select } from '@/components/ui/OldSelect';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const CAT_CONFIG = {
    todos:     { label: 'Todos',       emoji: '🛍️' },
    cabelo:    { label: 'Cabelo',      emoji: '💈' },
    barba:     { label: 'Barba',       emoji: '🪒' },
    acessorio: { label: 'Acessórios',  emoji: '🧴' },
};

// ─── Ícone carrinho ───────────────────────────────────────────────────────────
function CartIcon({ count }) {
    return (
        <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {count > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {count}
                </span>
            )}
        </div>
    );
}

// ─── Modal Carrinho ───────────────────────────────────────────────────────────
function CartModal({ cart, barbers, onClose, onRemove, onChangeQty, onCheckout, saving }) {
    const [barberId, setBarberId] = useState('');
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-card border border-border shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <CartIcon count={0} /> Carrinho
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Itens */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-4xl mb-3">🛒</p>
                            <p className="text-sm text-muted-foreground">Carrinho vazio</p>
                        </div>
                    ) : cart.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">
                                {CAT_CONFIG[item.category]?.emoji || '📦'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                                <p className="text-xs text-primary font-bold">{fmt(item.price)}</p>
                            </div>
                            {/* Controle de qtd */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => onChangeQty(item.id, item.qty - 1)} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-sm font-bold">−</button>
                                <span className="text-sm font-bold w-5 text-center text-foreground">{item.qty}</span>
                                <button onClick={() => onChangeQty(item.id, item.qty + 1)} disabled={item.qty >= item.stock} className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary transition-colors text-sm font-bold disabled:opacity-40">+</button>
                            </div>
                            <p className="text-sm font-bold text-foreground w-16 text-right flex-shrink-0">{fmt(item.price * item.qty)}</p>
                            <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer checkout */}
                {cart.length > 0 && (
                    <div className="px-6 py-4 border-t border-border flex-shrink-0 space-y-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Barbeiro responsável (opcional)</label>
                            <Select
                                value={barberId}
                                onChange={setBarberId}
                                options={[
                                    { value: '', label: 'Sem barbeiro associado' },
                                    ...barbers.map(b => ({ value: b.id, label: b.name }))
                                ]}
                                triggerClassName="w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm hover:bg-white/5"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold text-primary">{fmt(total)}</p>
                            </div>
                            <button
                                onClick={() => onCheckout(barberId)}
                                disabled={saving}
                                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                )}
                                Finalizar Compra
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Toast simples ────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, []);
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl bg-green-500/20 border border-green-500/40 backdrop-blur-sm flex items-center gap-2 text-green-400 text-sm font-semibold shadow-xl animate-fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {message}
        </div>
    );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ProductsStore() {
    const [products, setProducts] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('todos');
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [tab, setTab] = useState('loja');

    const loadReservations = useCallback(async () => {
        const res = await ProductReservation.list({ status: 'pendente' });
        setReservations(res);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [prods, brbs] = await Promise.all([Product.list(), Barber.list()]);
            // Oculta o produto fantasma usado para vendas de planos
            setProducts(prods.filter(p => p.is_active !== false && p.name !== 'Assinatura de Plano'));
            setBarbers(brbs.filter(b => b.is_active !== false));
            await loadReservations();
        } finally { setLoading(false); }
    }, [loadReservations]);

    useEffect(() => { 
        load(); 
        const intervalId = setInterval(async () => {
            await loadReservations();
            const [prods, brbs] = await Promise.all([Product.list(), Barber.list()]);
            setProducts(prods.filter(p => p.is_active !== false));
            setBarbers(brbs.filter(b => b.is_active !== false));
        }, 10000);
        return () => clearInterval(intervalId);
    }, [load, loadReservations]);

    const filtered = useMemo(() => products.filter(p => {
        const matchCat = category === 'todos' || p.category === category;
        const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    }), [products, category, search]);

    const addToCart = (product) => {
        setCart(prev => {
            const exists = prev.find(i => i.id === product.id);
            if (exists) {
                if (exists.qty >= (product.stock || 99)) return prev;
                return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...product, qty: 1 }];
        });
        setToast(`${product.name} adicionado ao carrinho`);
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
    const changeQty = (id, qty) => {
        if (qty <= 0) return removeFromCart(id);
        setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
    };

    const checkout = async (barberId) => {
        setSaving(true);
        try {
            const today = new Date().toISOString().slice(0, 10);
            for (const item of cart) {
                await Sale.create({
                    productId: item.id,
                    barberId: barberId || null,
                    quantity: item.qty,
                    unitPrice: item.price,
                    date: today,
                });
                if (item.stock !== undefined) {
                    await Product.update(item.id, { stock: Math.max(0, (item.stock || 0) - item.qty) });
                }
            }
            setCart([]);
            setShowCart(false);
            setToast('Compra finalizada com sucesso! 🎉');
            await load();
        } finally { setSaving(false); }
    };

    const handleAproveReservation = async (res) => {
        try {
            // Cria venda
            await Sale.create({
                productId: res.product_id,
                barberId: null,
                quantity: res.quantity || 1,
                unitPrice: res.price / (res.quantity || 1),
                date: new Date().toISOString().slice(0, 10),
            });
            // O estoque já foi reduzido no momento da criação da reserva! Não precisa reduzir de novo.
            // Marca reservada concluida
            await ProductReservation.update(res.id, { status: 'concluido' });
            setToast('Reserva aprovada com sucesso!');
            await loadReservations();
        } catch (e) {
            console.error(e);
        }
    };

    const cartCount = cart.reduce((s, i) => s + i.qty, 0);
    const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const cartItemQty = (id) => cart.find(i => i.id === id)?.qty || 0;

    return (
        <div className="space-y-6 w-full">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            <TypingText delay={0.1} holdDelay={4000} loop={false} text="Loja de Produtos" />
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">Gestão de Vendas e Reservas de Clientes</p>
                    </div>
                    
                    <TabsList className="inline-flex p-1 bg-secondary border border-border rounded-xl">
                        <TabsHighlightItem value="loja" className="flex-1">
                            <TabsTrigger value="loja" className="px-4 py-2 text-sm">Venda Direta</TabsTrigger>
                        </TabsHighlightItem>
                        <TabsHighlightItem value="reservas" className="flex-1">
                            <TabsTrigger value="reservas" className="px-4 py-2 text-sm flex items-center gap-2">
                                Reservas {reservations.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full">{reservations.length}</span>}
                            </TabsTrigger>
                        </TabsHighlightItem>
                    </TabsList>
                </div>

                <TabsContents>
                    <TabsContent value="loja">
                        <div className="space-y-6">
                            {/* Botão carrinho */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowCart(true)}
                                    className="relative flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all group"
                                >
                                    <CartIcon count={cartCount} />
                                    <div className="text-left">
                                        <p className="text-xs text-muted-foreground leading-none">Carrinho</p>
                                        <p className="text-sm font-bold text-foreground">{cartCount > 0 ? fmt(cartTotal) : 'Vazio'}</p>
                                    </div>
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    )}
                                </button>
                            </div>


            {/* Busca + Filtro de categoria */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Busca */}
                <div className="relative flex-1 max-w-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>
                {/* Filtros de categoria */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(CAT_CONFIG).map(([key, cfg]) => (
                        <button
                            key={key}
                            onClick={() => setCategory(key)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                                category === key
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                            }`}
                        >
                            <span>{cfg.emoji}</span>
                            <span>{cfg.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de produtos */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-16 gap-3">
                    <p className="text-4xl">🔍</p>
                    <p className="text-sm text-muted-foreground">Nenhum produto encontrado</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filtered.map(product => {
                        const inCart = cartItemQty(product.id);
                        const outOfStock = (product.stock ?? 99) === 0;
                        return (
                            <div
                                key={product.id}
                                className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                            >
                                {/* Imagem / Ícone */}
                                <div className="h-36 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                                    <span className="text-6xl group-hover:scale-110 transition-transform duration-300">
                                        {CAT_CONFIG[product.category]?.emoji || '📦'}
                                    </span>
                                    {outOfStock && (
                                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                                            <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded-full bg-secondary border border-border">Sem estoque</span>
                                        </div>
                                    )}
                                    {!outOfStock && product.stock !== undefined && product.stock <= 3 && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-[10px] font-bold text-orange-400 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                                                Últimas {product.stock}!
                                            </span>
                                        </div>
                                    )}
                                    {inCart > 0 && (
                                        <div className="absolute top-2 left-2">
                                            <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30">
                                                {inCart} no carrinho
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 flex flex-col gap-3 flex-1">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {CAT_CONFIG[product.category]?.label || product.category}
                                        </span>
                                        <p className="font-bold text-foreground mt-0.5">{product.name}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xl font-bold text-primary">{fmt(product.price)}</p>
                                        {product.stock !== undefined && (
                                            <p className="text-xs text-muted-foreground">{product.stock} em estoque</p>
                                        )}
                                    </div>

                                    {/* Botão adicionar */}
                                    {inCart === 0 ? (
                                        <button
                                            onClick={() => addToCart(product)}
                                            disabled={outOfStock}
                                            className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {outOfStock ? 'Indisponível' : '+ Adicionar ao Carrinho'}
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => changeQty(product.id, inCart - 1)} className="flex-none w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-foreground font-bold hover:border-primary transition-colors">−</button>
                                            <div className="flex-1 h-9 rounded-lg border border-primary bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">{inCart}</div>
                                            <button onClick={() => changeQty(product.id, inCart + 1)} disabled={inCart >= (product.stock ?? 99)} className="flex-none w-9 h-9 rounded-lg border border-border bg-secondary flex items-center justify-center text-foreground font-bold hover:border-primary transition-colors disabled:opacity-40">+</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

                        </div>
                    </TabsContent>

                    <TabsContent value="reservas">
                        <div className="bg-card border border-border rounded-2xl p-6">
                            <h2 className="text-lg font-bold mb-4">Pedidos Pendentes ({reservations.length})</h2>
                            {reservations.length === 0 ? (
                                <p className="text-muted-foreground text-sm">Nenhuma reserva pendente no momento.</p>
                            ) : (
                                <div className="space-y-3">
                                    {reservations.map(res => (
                                        <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/50">
                                            <div>
                                                <p className="font-bold text-foreground">{res.quantity || 1}x {res.product_name}</p>
                                                <p className="text-sm text-muted-foreground">Cliente: {res.client_name}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-bold text-primary">{fmt(res.price)}</p>
                                                <button 
                                                    onClick={() => handleAproveReservation(res)}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:bg-primary/90"
                                                >
                                                    Aprovar Venda
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </TabsContents>
            </Tabs>

            {/* Barra flutuante quando há itens no carrinho */}
            {cartCount > 0 && !showCart && tab === 'loja' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
                    <button
                        onClick={() => setShowCart(true)}
                        className="flex items-center gap-4 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:bg-primary/90 transition-all font-semibold text-sm"
                    >
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">{cartCount}</span>
                        Ver Carrinho
                        <span className="font-bold">{fmt(cartTotal)}</span>
                    </button>
                </div>
            )}

            {/* Modal carrinho */}
            {showCart && (
                <CartModal
                    cart={cart}
                    barbers={barbers}
                    onClose={() => setShowCart(false)}
                    onRemove={removeFromCart}
                    onChangeQty={changeQty}
                    onCheckout={checkout}
                    saving={saving}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </div>
    );
}
