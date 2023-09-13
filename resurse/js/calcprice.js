document.addEventListener("DOMContentLoaded", function() {
    const checkboxes = document.querySelectorAll(".form-check-input");
    const totalPriceElement = document.getElementById("totalPrice");
    let totalPrice = 0;

    checkboxes.forEach(checkbox => {
        const produsPret = parseFloat(checkbox.getAttribute("data-pret"));
        if (checkbox.checked) {
            totalPrice += produsPret;
        }
        
        checkbox.addEventListener("change", function() {
            if (this.checked) {
                totalPrice += produsPret;
            } else {
                totalPrice -= produsPret;
            }
            totalPriceElement.textContent = totalPrice.toFixed(2);
        });
    });

    totalPriceElement.textContent = totalPrice.toFixed(2);
});