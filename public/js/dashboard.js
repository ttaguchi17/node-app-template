document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Initial Security Check ---
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/logon.html';
        return; // Stop if not logged in
    }

    // --- 2. Define the Main Function First ---
    // This makes the function available to all the code below it.
    async function fetchAndRenderTrips() {
        const tripsContainer = document.getElementById('trips-container');
        tripsContainer.innerHTML = '<h2>Loading trips...</h2>';

        try {
            const response = await fetch('/api/trips', {
                method: 'GET',
                headers: { 'Authorization': token }
            });

            if (!response.ok) {
                localStorage.removeItem('token');
                window.location.href = '/logon.html';
                return;
            }

            const trips = await response.json();
            if (trips.length === 0) {
                tripsContainer.innerHTML = '<h2>You have no trips yet.</h2>';
            } else {
                tripsContainer.innerHTML = `<h2>Your Trips:</h2><pre>${JSON.stringify(trips, null, 2)}</pre>`;
            }
        } catch (error) {
            console.error('Failed to fetch trips:', error);
            tripsContainer.innerHTML = '<h2>Could not load trips. Please try again.</h2>';
        }
    }

    // --- 3. Set Up Event Listeners ---
    // Now that the function is defined, we can safely tell our buttons to use it.
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/';
        });
    }

    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            fetchAndRenderTrips(); // This will now work
        });
    }

    // --- 4. Make the Initial Call ---
    // Finally, run the function once to load the initial data.
    fetchAndRenderTrips(); // This will also work now
});