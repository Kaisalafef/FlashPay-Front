// js/customer.js

document.addEventListener('DOMContentLoaded', () => {
    const customerSection = document.getElementById('role-customer');
    
    // 1. منطق اختيار طريقة الدفع
    const pmCards = customerSection.querySelectorAll('.pm-card');
    pmCards.forEach(card => {
        card.addEventListener('click', () => {
            pmCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            console.log("طريقة الدفع المختارة:", card.querySelector('span').textContent);
        });
    });

    // 2. منطق إرسال الفورم
    const form = customerSection.querySelector('form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = form.querySelector('input[type="number"]').value;
        if(amount > 0) {
            alert(`تم استلام طلب تحويل مبلغ ${amount} بنجاح. سنقوم بالتواصل معك.`);
            form.reset();
        } else {
            alert("يرجى إدخال مبلغ صحيح");
        }
    });
});