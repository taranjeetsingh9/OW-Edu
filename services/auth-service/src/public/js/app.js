// Service configuration - ONLY services that are actually running
const SERVICES = {
    'auth': { port: 4000, name: 'Authentication Service' },
    'eco-edu': { port: 4010, name: 'EcoOrbit EDU' },
    // Comment out services that aren't running yet
    'greenlaunch': { port: 4020, name: 'GreenLaunch' },
    // 'orbitwatch': { port: 4030, name: 'OrbitWatch' },
    'planetmode': { port: 4040, name: 'Planet Mode' }
};

// Check service status on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('EcoOrbit 2.0 Frontend Loaded');
    checkAllServices();
});

// Check status of all services
async function checkAllServices() {
    console.log('Checking service status...');
    
    for (const [serviceKey, serviceConfig] of Object.entries(SERVICES)) {
        await checkServiceStatus(serviceKey, serviceConfig.port);
    }
    
    // Set other services as "Coming Soon"
    setComingSoonServices();
}

// Set services that aren't running as "Coming Soon"
function setComingSoonServices() {
    const comingSoonServices = ['greenlaunch', 'orbitwatch', 'planetmode'];
    
    comingSoonServices.forEach(serviceKey => {
        const statusElement = document.getElementById(`${serviceKey}-status`);
        const dashStatusElement = document.getElementById(`${serviceKey}-dash-status`);
        
        if (statusElement) {
            statusElement.textContent = 'Coming Soon';
            statusElement.className = 'service-status status-checking';
        }
        
        if (dashStatusElement) {
            dashStatusElement.textContent = 'Coming Soon';
            dashStatusElement.className = 'service-status status-checking';
        }
    });
}

// Check individual service status with better error handling
async function checkServiceStatus(serviceKey, port) {
    const statusElement = document.getElementById(`${serviceKey}-status`);
    const dashStatusElement = document.getElementById(`${serviceKey}-dash-status`);
    
    if (statusElement) {
        statusElement.textContent = 'Checking...';
        statusElement.className = 'service-status status-checking';
    }
    
    if (dashStatusElement) {
        dashStatusElement.textContent = 'Checking...';
        dashStatusElement.className = 'service-status status-checking';
    }
    
    try {
        console.log(`Checking ${serviceKey} on port ${port}...`);
        
        const response = await fetch(`http://localhost:${port}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`${serviceKey} is online:`, data);
            
            if (statusElement) {
                statusElement.textContent = 'Online';
                statusElement.className = 'service-status status-online';
            }
            
            if (dashStatusElement) {
                dashStatusElement.textContent = 'Online';
                dashStatusElement.className = 'service-status status-online';
            }
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.log(`${serviceKey} is offline:`, error.message);
        
        if (statusElement) {
            statusElement.textContent = 'Offline';
            statusElement.className = 'service-status status-offline';
        }
        
        if (dashStatusElement) {
            dashStatusElement.textContent = 'Offline';
            dashStatusElement.className = 'service-status status-offline';
        }
    }
}

// Navigate to service
function navigateToService(serviceKey) {
    const service = SERVICES[serviceKey];
    if (service) {
        console.log(`Navigating to ${serviceKey} on port ${service.port}`);
        window.location.href = `http://localhost:${service.port}`;
    } else {
        alert('This service is coming soon!');
    }
}

// Add click handlers for service cards
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers to all service cards
    const serviceCards = document.querySelectorAll('.service-card, .dashboard-card');
    serviceCards.forEach(card => {
        // Remove old onclick handlers
        card.removeAttribute('onclick');
        
        // Add new event listener
        card.addEventListener('click', function() {
            const serviceKey = this.querySelector('.service-icon').textContent;
            let service = '';
            
            if (serviceKey.includes('👨‍🚀')) service = 'eco-edu';
            else if (serviceKey.includes('🔐')) service = 'auth';
            else if (serviceKey.includes('🚀')) service = 'greenlaunch';
            else if (serviceKey.includes('🛰️')) service = 'orbitwatch';
            else if (serviceKey.includes('🌕')) service = 'planetmode';
            
            if (service) {
                navigateToService(service);
            }
        });
    });
});