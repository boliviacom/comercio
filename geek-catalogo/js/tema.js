document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const colorPickerToggle = document.getElementById('color-picker-toggle');
    const colorSwitcher = document.getElementById('color-switcher');
    const colorSwatches = colorSwitcher.querySelectorAll('.color-swatch');

    const darkModeIcon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

    const applyMode = (mode) => {
        if (mode === 'dark') {
            body.classList.add('dark-mode');
            if (darkModeIcon) {
                darkModeIcon.classList.remove('fa-moon');
                darkModeIcon.classList.add('fa-sun');
            }
        } else {
            body.classList.remove('dark-mode');
            if (darkModeIcon) {
                darkModeIcon.classList.remove('fa-sun');
                darkModeIcon.classList.add('fa-moon');
            }
        }
    };
    
    const currentMode = localStorage.getItem('mode') || 'light';
    applyMode(currentMode);

    const currentTheme = localStorage.getItem('theme') || 'default';
    if (currentTheme !== 'default') {
        body.classList.add(`theme-${currentTheme}`);
    }

    const setActiveSwatch = (theme) => {
        colorSwatches.forEach(swatch => {
            swatch.classList.remove('active');
            if (swatch.dataset.theme === theme) {
                swatch.classList.add('active');
            }
        });
    };
    setActiveSwatch(currentTheme);

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const isDark = body.classList.contains('dark-mode');
            const newMode = isDark ? 'light' : 'dark';
            
            applyMode(newMode);
            localStorage.setItem('mode', newMode);
        });
    }

    if (colorPickerToggle) {
        colorPickerToggle.addEventListener('click', () => {
            colorSwitcher.classList.toggle('open');
        });
    }

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const theme = swatch.dataset.theme;

            body.classList.remove('theme-sunset', 'theme-ocean');

            if (theme !== 'default') {
                body.classList.add(`theme-${theme}`);
            }

            localStorage.setItem('theme', theme);
            setActiveSwatch(theme);

            colorSwitcher.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (colorSwitcher && colorPickerToggle &&
            !colorSwitcher.contains(e.target) &&
            !colorPickerToggle.contains(e.target)) {
            colorSwitcher.classList.remove('open');
        }
    });
});