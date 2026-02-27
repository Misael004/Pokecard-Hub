
        document.addEventListener("DOMContentLoaded", function () {
            // 1. Configuramos AOS con once: false para permitir repetición
            AOS.init({
                duration: 800,
                once: false, // Permitir que las animaciones se repitan
                mirror: true, // Refleja la animación al hacer scroll hacia arriba (opcional)
                offset: 50
            });

            const footer = document.querySelector('#main-footer');
            const internalElements = footer.querySelectorAll('[data-aos]');

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // CUANDO EL FOOTER ENTRA EN VISTA
                        footer.classList.add('visible');

                        // Disparamos las animaciones internas de AOS
                        setTimeout(() => {
                            AOS.refresh();
                            internalElements.forEach(el => {
                                el.classList.add('aos-animate');
                            });
                        }, 150);
                    } else {
                        // CUANDO EL FOOTER SALE DE VISTA
                        // Removemos la clase visible para que el fondo se oculte
                        footer.classList.remove('visible');

                        // Removemos la clase de AOS para que los elementos se "reseteen"
                        internalElements.forEach(el => {
                            el.classList.remove('aos-animate');
                        });
                    }
                });
            }, {
                threshold: 0.1 // Se activa en cuanto asoma el 10%
            });

            if (footer) observer.observe(footer);
        });