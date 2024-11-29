// Feature flags for controlling application functionality
export const FEATURES = {
    EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true' || false,
    EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' || false,
    VICTORY_MOCK_DATA: process.env.ENABLE_VICTORY_MOCK_DATA === 'true' || false
};

// Helper functions to check feature status
export const isFeatureEnabled = (featureName) => {
    return FEATURES[featureName] || false;
};

// Dummy functions for disabled features
export const noOpAsync = async () => true;
export const noOpSync = () => true;
