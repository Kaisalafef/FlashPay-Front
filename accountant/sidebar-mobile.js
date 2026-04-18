/* =====================================================
   sidebar-mobile.js — FlashPay
   دوال مشتركة للتحكم بالسايدبار على الموبايل
   أضف هذا الملف في cashier.html و admin.html
   قبل إغلاق </body> وبعد سكريبت اللوحة الرئيسي
   ===================================================== */

/**
 * فتح / إغلاق السايدبار
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar || !overlay) return;

  const isOpen = sidebar.classList.contains("open");
  if (isOpen) {
    closeSidebar();
  } else {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // منع التمرير خلف الـ drawer
  }
}

/**
 * إغلاق السايدبار (يُستدعى من الـ overlay أو من روابط الـ nav)
 */
function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (!sidebar || !overlay) return;

  sidebar.classList.remove("open");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

/**
 * إغلاق السايدبار عند النقر على أي رابط في الـ nav (موبايل فقط)
 */
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".sidebar nav a");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 480) {
        closeSidebar();
      }
    });
  });
});
