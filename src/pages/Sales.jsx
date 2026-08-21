import React, { useEffect, useState, useCallback } from 'react';
import { Product, Sale, Barber } from '@/api/base44Client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Select } from '@/components/ui/OldSelect';
import { DatePicker } from '@/components/ui/DatePicker';

const fmt = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const CAT_LABELS = { cabelo: '💈 Cabelo', barba: '🪒 Barba', acessorio: '🧴 Acessório' };

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center sm:items-start sm:pt-20 pb-20">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-lg flex flex-col rounded-2xl bg-card border border-border shadow-2xl my-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 overflow-visible">{children}</div>
            </div>
        </div>
    );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary";

export default function Sales() {
    const [tab, setTab] = useState('vendas'); // 'vendas' | 'produtos'
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(null); // 'sale' | 'product' | null
    const [saving, setSaving] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteSaleId, setDeleteSaleId] = useState(null);
    const [deleteProductId, setDeleteProductId] = useState(null);

    const EMPTY_SALE = { productId: '', barberId: '', quantity: 1, date: new Date().toISOString().slice(0, 10) };
    const EMPTY_PRODUCT = { name: '', category: 'cabelo', price: '', cost: '', stock: '', is_active: true };
    const [saleForm, setSaleForm] = useState(EMPTY_SALE);
    const [prodForm, setProdForm] = useState(EMPTY_PRODUCT);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [prods, sls, brbs] = await Promise.all([Product.list(), Sale.list(), Barber.list()]);
            // Oculta o produto fantasma usado para vendas de planos
            setProducts(prods.filter(p => p.name !== 'Assinatura de Plano').sort((a, b) => a.name?.localeCompare(b.name)));
            setSales(sls.sort((a, b) => b.date?.localeCompare(a.date)));
            setBarbers(brbs.filter(b => b.is_active !== false));
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Venda
    const openNewSale = () => { setSaleForm(EMPTY_SALE); setShowModal('sale'); };
    const handleSaveSale = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const prod = products.find(p => p.id === saleForm.productId);
            if (!prod) return;
            const qty = Number(saleForm.quantity);
            await Sale.create({ ...saleForm, unitPrice: prod.price, quantity: qty });
            // Subtrai estoque
            if (prod.stock !== undefined) await Product.update(prod.id, { stock: Math.max(0, (prod.stock || 0) - qty) });
            setShowModal(null); await load();
        } finally { setSaving(false); }
    };
    const handleDeleteSale = async () => { 
        if (!deleteSaleId) return;
        await Sale.delete(deleteSaleId); 
        setDeleteSaleId(null);
        await load(); 
    };

    // Produto
    const openNewProduct = () => { setProdForm(EMPTY_PRODUCT); setEditId(null); setShowModal('product'); };
    const openEditProduct = (p) => { setProdForm({ name: p.name||'', category: p.category||'cabelo', price: p.price||'', cost: p.cost||'', stock: p.stock||'', is_active: p.is_active !== false }); setEditId(p.id); setShowModal('product'); };
    const handleSaveProduct = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const d = { ...prodForm, price: Number(prodForm.price), cost: Number(prodForm.cost), stock: Number(prodForm.stock) };
            if (editId) await Product.update(editId, d); else await Product.create(d);
            setShowModal(null); await load();
        } finally { setSaving(false); }
    };
    const handleDeleteProduct = async () => { 
        if (!deleteProductId) return;
        await Product.delete(deleteProductId); 
        setDeleteProductId(null);
        await load(); 
    };

    const totalSales = sales.reduce((s, v) => s + (v.total || 0), 0);
    const selectedProduct = products.find(p => p.id === saleForm.productId);

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex bg-secondary rounded-xl p-1 gap-1">
                    {[['vendas', 'Vendas'], ['produtos', 'Produtos']].map(([val, lbl]) => (
                        <button key={val} onClick={() => setTab(val)} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === val ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>{lbl}</button>
                    ))}
                </div>
                <button onClick={tab === 'vendas' ? openNewSale : openNewProduct} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    {tab === 'vendas' ? 'Nova Venda' : 'Novo Produto'}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
            ) : tab === 'vendas' ? (
                <>
                    {/* Cards resumo */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total Vendas</p>
                            <p className="text-2xl font-bold text-primary mt-1">{fmt(totalSales)}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Nº de Vendas</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{sales.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Ticket Médio</p>
                            <p className="text-2xl font-bold text-foreground mt-1">{fmt(sales.length ? totalSales / sales.length : 0)}</p>
                        </div>
                    </div>

                    {/* Tabela vendas */}
                    {sales.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center py-16 gap-3">
                            <p className="text-sm text-muted-foreground">Nenhuma venda registrada</p>
                            <button onClick={openNewSale} className="text-xs text-primary hover:underline">Registrar primeira venda →</button>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-secondary/50">
                                        <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Produto</th>
                                        <th className="text-left px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Barbeiro</th>
                                        <th className="text-center px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Qtd</th>
                                        <th className="text-right px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total</th>
                                        <th className="text-center px-4 py-3 text-xs text-muted-foreground font-semibold uppercase tracking-wider">Data</th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((s, i) => (
                                        <tr key={s.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                                            <td className="px-4 py-3 font-medium text-foreground">{s.product_name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{s.barber_name || '—'}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{s.quantity}x</td>
                                            <td className="px-4 py-3 text-right font-bold text-primary">{fmt(s.total)}</td>
                                            <td className="px-4 py-3 text-center text-muted-foreground">{s.date ? new Date(s.date + 'T12:00').toLocaleDateString('pt-BR') : '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => setDeleteSaleId(s.id)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            ) : (
                /* Tab Produtos */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                        <div key={p.id} className={`rounded-xl border bg-card p-5 flex flex-col gap-3 group hover:border-primary/30 transition-all ${p.is_active === false ? 'opacity-60' : 'border-border'}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">{p.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{CAT_LABELS[p.category] || p.category}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEditProduct(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </button>
                                    <button onClick={() => setDeleteProductId(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                                <div><p className="text-xs text-muted-foreground">Preço</p><p className="text-sm font-bold text-primary">{fmt(p.price)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Custo</p><p className="text-sm font-semibold text-foreground">{fmt(p.cost)}</p></div>
                                <div><p className="text-xs text-muted-foreground">Estoque</p>
                                    <p className={`text-sm font-bold ${(p.stock || 0) < 3 ? 'text-red-400' : 'text-foreground'}`}>{p.stock ?? 0} un</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Nova Venda */}
            {showModal === 'sale' && (
                <Modal title="Nova Venda" onClose={() => setShowModal(null)}>
                    <form onSubmit={handleSaveSale} className="space-y-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Produto *</label>
                            <Select
                                value={saleForm.productId}
                                onChange={val => setSaleForm(f => ({ ...f, productId: val }))}
                                options={[
                                    { value: '', label: 'Selecione um produto...' },
                                    ...products.filter(p => p.is_active !== false).map(p => ({
                                        value: p.id,
                                        label: `${p.name} — ${fmt(p.price)} (Estoque: ${p.stock ?? 0})`
                                    }))
                                ]}
                                triggerClassName={inputCls}
                            />
                        </div>
                        {selectedProduct && (
                            <div className="rounded-lg bg-primary/10 border border-primary/20 px-4 py-3 text-sm">
                                <span className="text-muted-foreground">Preço unitário: </span>
                                <span className="font-bold text-primary">{fmt(selectedProduct.price)}</span>
                                <span className="text-muted-foreground ml-4">Total: </span>
                                <span className="font-bold text-primary">{fmt(selectedProduct.price * (Number(saleForm.quantity) || 1))}</span>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Barbeiro</label>
                            <Select
                                value={saleForm.barberId}
                                onChange={val => setSaleForm(f => ({ ...f, barberId: val }))}
                                options={[
                                    { value: '', label: 'Sem barbeiro associado' },
                                    ...barbers.map(b => ({ value: b.id, label: b.name }))
                                ]}
                                triggerClassName={inputCls}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Quantidade *</label>
                                <input type="number" required min="1" value={saleForm.quantity} onChange={e => setSaleForm(f => ({ ...f, quantity: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Data</label>
                                <DatePicker value={saleForm.date} onChange={val => setSaleForm(f => ({ ...f, date: val }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">{saving ? 'Salvando...' : 'Registrar Venda'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Modal Produto */}
            {showModal === 'product' && (
                <Modal title={editId ? 'Editar Produto' : 'Novo Produto'} onClose={() => setShowModal(null)}>
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Nome do produto *</label>
                            <input required value={prodForm.name} onChange={e => setProdForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Pomada Modeladora" className={inputCls} />
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Categoria</label>
                            <Select
                                value={prodForm.category}
                                onChange={val => setProdForm(f => ({ ...f, category: val }))}
                                options={[
                                    { value: 'cabelo', label: '💈 Cabelo' },
                                    { value: 'barba', label: '🪒 Barba' },
                                    { value: 'acessorio', label: '🧴 Acessório' }
                                ]}
                                triggerClassName={inputCls}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Preço venda (R$) *</label>
                                <input type="number" required min="0" step="0.01" value={prodForm.price} onChange={e => setProdForm(f => ({ ...f, price: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Custo (R$)</label>
                                <input type="number" min="0" step="0.01" value={prodForm.cost} onChange={e => setProdForm(f => ({ ...f, cost: e.target.value }))} className={inputCls} />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Estoque</label>
                                <input type="number" min="0" value={prodForm.stock} onChange={e => setProdForm(f => ({ ...f, stock: e.target.value }))} className={inputCls} />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setProdForm(f => ({ ...f, is_active: !f.is_active }))} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${prodForm.is_active ? 'bg-primary' : 'bg-muted'}`}>
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${prodForm.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                            <span className="text-sm text-muted-foreground">Produto ativo</span>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShowModal(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors">Cancelar</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">{saving ? 'Salvando...' : editId ? 'Salvar alterações' : 'Criar produto'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            <ConfirmDialog 
                open={!!deleteSaleId} 
                onOpenChange={(open) => !open && setDeleteSaleId(null)}
                title="Excluir Venda?"
                description="Tem certeza que deseja excluir esta venda? O valor será removido do faturamento (o estoque não será devolvido automaticamente)."
                onConfirm={handleDeleteSale}
                confirmText="Excluir Venda"
            />

            <ConfirmDialog 
                open={!!deleteProductId} 
                onOpenChange={(open) => !open && setDeleteProductId(null)}
                title="Excluir Produto?"
                description="Tem certeza que deseja excluir este produto do catálogo? Vendas já realizadas não serão afetadas."
                onConfirm={handleDeleteProduct}
                confirmText="Excluir Produto"
            />
        </div>
    );
}
