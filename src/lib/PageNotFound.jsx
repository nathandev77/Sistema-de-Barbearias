import React from 'react';
import { Link } from 'react-router-dom';

export default function PageNotFound() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-6">
            <div className="text-center space-y-2">
                <p className="text-8xl font-bold text-primary font-heading">404</p>
                <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
                <p className="text-muted-foreground text-sm">
                    The page you are looking for does not exist or has been removed.
                </p>
            </div>
            <Link
                to="/"
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
                Back to home
            </Link>
        </div>
    );
}
