document.addEventListener('DOMContentLoaded', function() {
    const figures = Array.from(document.querySelectorAll('.galerie-dinamica figure'));
    let currentFigureIndex = 0;

    function showNextFigure() {
        figures.forEach((figure, index) => {
            figure.classList.remove('active');
            if (index === currentFigureIndex) {
                figure.classList.add('active');
            }
        });
        currentFigureIndex = (currentFigureIndex + 1) % figures.length;
    }

    setInterval(showNextFigure, 3000);
});