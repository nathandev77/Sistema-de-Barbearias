import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Product, ProductReservation } from '@/api/base44Client';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/toaster';

export default function ProductCatalog() {
    const { clientUser } = useAuth();
    const { toast } = useToast();
    
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [quantities, setQuantities] = useState({});

    const getQty = (id) => quantities[id] || 1;
    const updateQty = (id, val, max) => {
        if (val >= 1 && val <= max) {
            setQuantities(prev => ({ ...prev, [id]: val }));
        }
    };

    const load = () => Product.list({ is_active: true }).then(prods => {
        // Remove o produto oculto usado para registrar vendas de planos
        setProducts(prods.filter(p => p.name !== 'Assinatura de Plano'));
    });

    useEffect(() => {
        load();
    }, []);

    const handleRequest = (product) => {
        setSelectedProduct({ ...product, selectedQty: getQty(product.id) });
        setIsConfirmOpen(true);
    };

    const confirmReservation = async () => {
        setLoading(true);
        try {
            await ProductReservation.create({
                client_id: clientUser?.id,
                client_name: clientUser?.full_name,
                product_id: selectedProduct.id,
                product_name: selectedProduct.name,
                price: selectedProduct.price,
                quantity: selectedProduct.selectedQty,
                status: 'pendente',
            });
            setIsConfirmOpen(false);
            toast({
                title: 'Reserva Realizada!',
                description: `Sua solicitação de ${selectedProduct.selectedQty}x ${selectedProduct.name} foi enviada para a barbearia.`,
            });
            await load(); // Atualiza estoque na tela
            setQuantities(prev => ({ ...prev, [selectedProduct.id]: 1 }));
        } catch (e) {
            toast({
                title: 'Erro ao reservar',
                description: 'Tente novamente mais tarde. ' + (e.message || ''),
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
            setSelectedProduct(null);
        }
    };

    return (
        <div style={{
            background: 'rgba(15, 17, 21, 0.4)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 24,
            padding: '32px',
        }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Produtos Disponíveis</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                {products.map(p => (
                    <div key={p.id} style={{ 
                        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20,
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'hsl(217 91% 60%)', textTransform: 'uppercase', marginBottom: 4 }}>
                                {p.category}
                            </div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{p.name}</h3>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'hsl(210 20% 95%)' }}>
                                R$ {p.price.toFixed(2)}
                            </div>
                            <div style={{ fontSize: 12, color: 'hsl(220 10% 50%)', marginTop: 4 }}>
                                {p.stock > 0 ? `${p.stock} em estoque` : 'Sem estoque'}
                            </div>
                        </div>

                        {p.stock > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 }}>
                                <button disabled={getQty(p.id) <= 1} onClick={() => updateQty(p.id, getQty(p.id) - 1, p.stock)} style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>-</button>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{getQty(p.id)}</span>
                                <button disabled={getQty(p.id) >= p.stock} onClick={() => updateQty(p.id, getQty(p.id) + 1, p.stock)} style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer' }}>+</button>
                            </div>
                        )}
                        
                        <button 
                            disabled={p.stock <= 0}
                            onClick={() => handleRequest(p)}
                            style={{ 
                                marginTop: 12, width: '100%', padding: '10px', borderRadius: 8, border: 'none', 
                                background: p.stock > 0 ? 'hsl(217 91% 60%)' : 'rgba(255,255,255,0.1)', 
                                color: p.stock > 0 ? '#fff' : 'hsl(220 10% 50%)', 
                                cursor: p.stock > 0 ? 'pointer' : 'not-allowed', fontWeight: 600 
                            }}
                        >
                            Solicitar Reserva
                        </button>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={isConfirmOpen}
                onOpenChange={(v) => !loading && setIsConfirmOpen(v)}
                onConfirm={confirmReservation}
                title="Confirmar Reserva"
                description={`Você deseja reservar ${selectedProduct?.selectedQty}x "${selectedProduct?.name}" por R$ ${(selectedProduct?.price * selectedProduct?.selectedQty || 0).toFixed(2)}? O pagamento será feito na barbearia e o produto já ficará separado para você.`}
                confirmText={loading ? 'Reservando...' : 'Sim, Reservar'}
                cancelText="Cancelar"
            />
        </div>
    );
}
