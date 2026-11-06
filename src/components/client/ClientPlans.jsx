import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/toaster';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Loader2, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
// If fetchApi doesn't work directly for the client, we'd need public or portal routes.
// But does ClientPortal already have the client logged in? Yes, in localStorage or the auth context.
import { fetchApi } from '@/api/base44Client';

export default function ClientPlans() {
    const { clientUser, slug } = useAuth();
    const [plans, setPlans] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [myPendingSub, setMyPendingSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        const load = async () => {
            try {
                // On the public or portal route, the tenant is resolved via Header or Auth
                const [plansData, subsData] = await Promise.all([
                    fetchApi('/plans'),
                    clientUser?.id ? fetchApi(`/plans/client/${clientUser.id}`) : Promise.resolve([])
                ]);
                
                setPlans(plansData);
                
                
                const active = subsData.find(s => s.status === 'active' && new Date(s.endDate) > new Date());
                setMySub(active || null);
                
                const pending = subsData.find(s => s.status === 'pendente');
                setMyPendingSub(pending || null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [clientUser]);

    const handleConfirmSubscribe = async () => {
        if (!selectedPlan) return;
        setSubscribing(true);
        try {
            await fetchApi('/plans/subscribe', {
                method: 'POST',
                body: JSON.stringify({ clientId: clientUser.id, planId: selectedPlan.id, status: 'pendente' })
            });
            toast({
                title: 'Request Sent',
                description: 'Let the barber know so they can confirm your payment and activate the subscription.',
            });
            // Reload locally
            const subsData = await fetchApi(`/plans/client/${clientUser.id}`);
            const pending = subsData.find(s => s.status === 'pendente');
            setMyPendingSub(pending || null);
        } catch (e) {
            toast({
                title: 'Error subscribing',
                description: e.message,
                variant: 'destructive',
            });
        } finally {
            setSubscribing(false);
            setSelectedPlan(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {mySub && (
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Star className="w-24 h-24 text-primary" />
                    </div>
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                            Active Subscription
                        </span>
                        <h3 className="text-2xl font-black text-foreground mb-1">{mySub.plan.name}</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                            You have <strong className="text-foreground">{mySub.creditsLeft} haircuts</strong> left this month! 
                            They will be deducted automatically from your upcoming appointments.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-4 text-xs font-mono">
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Subscribed on:</span>
                                <span className="text-foreground font-semibold">{new Date(mySub.startDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-0.5">Valid until:</span>
                                <span className="text-foreground font-semibold">{new Date(mySub.endDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {myPendingSub && (
                <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border border-yellow-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase tracking-widest mb-4">
                            Pending Subscription
                        </span>
                        <h3 className="text-2xl font-black text-foreground mb-1">{myPendingSub.plan.name}</h3>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Your request has been sent! Payment must be settled at the barbershop front desk so the barber can activate your subscription.
                        </p>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> Available Plans
                </h3>
                {plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No plans available at the moment.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plans.map(plan => (
                            <motion.div whileHover={{ scale: 1.02 }} key={plan.id} className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden group">
                                <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1 min-h-[40px]">{plan.description}</p>
                                
                                <div className="mt-4 mb-5">
                                    <span className="text-2xl font-black text-foreground">R$ {Number(plan.price).toFixed(2)}</span>
                                    <span className="text-xs text-muted-foreground"> /month</span>
                                </div>

                                <ul className="space-y-2 mb-6">
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="w-4 h-4 text-primary" />
                                        <span className="font-semibold text-foreground">{plan.serviceCount} haircuts</span> per month
                                    </li>
                                </ul>

                                <button 
                                    onClick={() => setSelectedPlan(plan)}
                                    className="w-full py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary hover:text-primary-foreground transition-all"
                                >
                                    Subscribe
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!selectedPlan}
                onOpenChange={(v) => !subscribing && setSelectedPlan(null)}
                title="Subscribe to Plan"
                description={`Do you want to request a subscription to the "${selectedPlan?.name}" plan for R$ ${Number(selectedPlan?.price).toFixed(2)} per month? Payment must be made at the barbershop.`}
                onConfirm={handleConfirmSubscribe}
                confirmText={subscribing ? 'Sending...' : 'Request Subscription'}
                cancelText="Cancel"
            />
        </div>
    );
}
