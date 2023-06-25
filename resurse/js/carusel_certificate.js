function updateRandomNumbers() {
    fetch('/certificate')
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => console.error(error));
}


updateRandomNumbers();
setInterval(updateRandomNumbers, 15000);
function updateCarousel() {
    fetch('/random-numbers') // Assuming you have an endpoint to fetch the updated random numbers
      .then(response => response.json())
      .then(data => {
        const carouselItems = document.querySelectorAll('.carousel-item');
        const images = document.querySelectorAll('.carousel-item img');
  
        // Update the image sources with the new random numbers
        images.forEach((image, index) => {
          const newIndex = data[index];
          const newSrc = `..${data[newIndex].fisier}`;
          image.setAttribute('src', newSrc);
          image.setAttribute('alt', `Slide ${newIndex + 1}`);
        });
  
        // Remove and add 'active' class to the carousel items
        carouselItems.forEach(item => item.classList.remove('active'));
        carouselItems[data[0]].classList.add('active');
      })
      .catch(error => {
        console.error('Error fetching random numbers:', error);
      });
  }
  
  // Call the updateCarousel function initially and every 15 seconds
  updateCarousel();
  setInterval(updateCarousel, 15000);
// Call the function every 15 seconds
