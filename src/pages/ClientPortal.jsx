import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsContents,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from '@/components/animate-ui/primitives/animate/tabs';
import BookingWizard from '@/components/client/BookingWizard';
import ProductCatalog from '@/components/client/ProductCatalog';

import ClientPlans from '@/components/client/ClientPlans';

export default function ClientPortal() {
    const [tab, setTab] = useState('booking');

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsHighlight className="mb-6">
                    <TabsList className="w-full inline-flex p-1" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
                        <TabsHighlightItem value="booking" className="flex-1">
                            <TabsTrigger value="booking" className="w-full py-3" style={{ fontSize: 14 }}>
                                Agendar
                            </TabsTrigger>
                        </TabsHighlightItem>
                        <TabsHighlightItem value="products" className="flex-1">
                            <TabsTrigger value="products" className="w-full py-3" style={{ fontSize: 14 }}>
                                Produtos
                            </TabsTrigger>
                        </TabsHighlightItem>
                        <TabsHighlightItem value="plans" className="flex-1">
                            <TabsTrigger value="plans" className="w-full py-3" style={{ fontSize: 14 }}>
                                Planos VIP
                            </TabsTrigger>
                        </TabsHighlightItem>
                    </TabsList>
                </TabsHighlight>

                <TabsContents>
                    <TabsContent value="booking">
                        <BookingWizard />
                    </TabsContent>
                    <TabsContent value="products">
                        <ProductCatalog />
                    </TabsContent>
                    <TabsContent value="plans">
                        <ClientPlans />
                    </TabsContent>
                </TabsContents>
            </Tabs>
        </div>
    );
}
