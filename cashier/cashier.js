const API_URL = "http://127.0.0.1:8000/api";
async function checkAuth() {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    window.location.href = "/FlashPay-Front/login/login.html";
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    // التوكن غير صالح (بعد migrate:fresh مثلاً)
    if (!res.ok) {
      localStorage.clear();
      window.location.href = "/FlashPay-Front/login/login.html";
      return null;
    }

    return token;
  } catch (e) {
    localStorage.clear();
    window.location.href = "/FlashPay-Front/login/login.html";
    return null;
  }
}
async function loadNewTransfers() {
  try {
    // تعديل: جلب الحوالات التي وافق عليها الإدارة فقط
    const res = await fetch(`${API_URL}/transfers?status=ready`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    const tbody = document.getElementById("new-transfers-list");
    tbody.innerHTML = "";

    json.data.forEach((transfer) => {
      tbody.innerHTML += `
        <tr>
            <td>#${transfer.id}</td>
            <td>${transfer.sender?.name ?? ""}</td>
            <td>$${transfer.amount}</td>
            <td>
               <div class="upload-wrapper">
    <label class="custom-file-upload">
        <input type="file" 
               id="id_image_${transfer.id}" 
               accept="image/*"
               onchange="previewImage(event, ${transfer.id})">
        <i class="fa-solid fa-id-card"></i>
        اختيار صورة الهوية
    </label>

    <span class="file-name" id="file_name_${transfer.id}">
        لم يتم اختيار ملف
    </span>

    <img id="preview_${transfer.id}" class="preview-img hidden">
</div>

<button class="btn-primary"
        onclick="acceptTransfer(${transfer.id})">
    تأكيد التسليم
</button>
                
            </td>
        </tr>
    `;
    });
  } catch (error) {
    console.error("Error loading transfers:", error);
  }
}

function previewImage(event, id) {
  const file = event.target.files[0];

  if (!file) return;

  document.getElementById(`file_name_${id}`).textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.getElementById(`preview_${id}`);
    img.src = e.target.result;
    img.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}
async function acceptTransfer(transferId) {
  const fileInput = document.getElementById(`id_image_${transferId}`);
  const file = fileInput.files[0];

  if (!file) {
    alert("يرجى اختيار صورة الهوية أولاً");
    return;
  }

  const formData = new FormData();
  formData.append("_method", "PATCH"); // 👈 هذا السطر السحري
  formData.append("status", "completed");
  formData.append("receiver_id_image", file);

  try {
    const res = await fetch(
      `${API_URL}/transfers/${transferId}/update-status`,
      {
        method: "POST", // 👈 أصبحت POST
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      },
    );

    const data = await res.json();
    console.log(data);

    if (res.ok) {
      alert("تم تأكيد التسليم بنجاح");
      loadNewTransfers();
    } else {
      alert(data.message || "فشل التحديث");
    }
  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
  }
}

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  localStorage.removeItem("auth_token");
  window.location.href = "../login/login.html";
}
document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  loadNewTransfers();
});
