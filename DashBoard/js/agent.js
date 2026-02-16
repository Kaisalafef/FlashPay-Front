// js/agent.js

const AgentManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const agentSection = document.getElementById('role-agent');
        if(!agentSection) return;

        // تبديل التبويبات (نقدي، داخلي، فيزا)
        const tabs = agentSection.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        // زر إتمام العملية للوكيل
        const submitBtn = agentSection.querySelector('.btn-primary.full-width');
        submitBtn.addEventListener('click', () => {
            this.processTransfer();
        });
    },

    processTransfer() {
        const balanceEl = document.querySelector('.wallet-balance');
        alert("جاري معالجة الحوالة من قبل الوكيل...");
        // منطق تحديث الرصيد بشكل وهمي للبيان
        let current = parseFloat(balanceEl.textContent.replace('$', ''));
        balanceEl.textContent = `$${(current - 100).toLocaleString()}`;
    }
};

document.addEventListener('DOMContentLoaded', () => AgentManager.init());