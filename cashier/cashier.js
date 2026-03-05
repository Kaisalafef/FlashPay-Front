const API_URL = "http://127.0.0.1:8000/api";
let token = null;

/* ============================= */
/*            AUTH              */
/* ============================= */

async function checkAuth() {
  const storedToken = localStorage.getItem("auth_token");

  if (!storedToken) {
    window.location.href = "../login/login.html";
    return null;
  }

  try {
    const res = await fetch(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      localStorage.clear();
      window.location.href = "../login/login.html";
      return null;
    }

    return storedToken;
  } catch (e) {
    localStorage.clear();
    window.location.href = "../login/login.html";
    return null;
  }
}

/* ============================= */
/*      LOAD READY TRANSFERS    */
/* ============================= */

async function loadNewTransfers() {
  try {
    const res = await fetch(`${API_URL}/transfers?status=ready`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const json = await res.json();
    const tbody = document.getElementById("new-transfers-list");
    tbody.innerHTML = "";

    if (json.status === "success" && Array.isArray(json.data)) {
    json.data.forEach((transfer) => {

    const amount = Number(transfer.amount);
    

   const currencyPrice = Number(transfer.currency?.price ?? 1);
const currencyCode = transfer.currency?.code ?? "USD";
    const deliveryPrice = amount * currencyPrice;

    tbody.innerHTML += `
      <tr>
          <td>#${transfer.id}</td>
          <td>${transfer.sender?.name ?? "-"}</td>
          <td>$${amount.toFixed(2)}</td>
          <td>${currencyCode}</td>
          <td style="font-weight:bold; color:#1e3c72;">
              ${deliveryPrice.toFixed(2)} ${currencyCode}
          </td>
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

    <button id="btn_${transfer.id}"
            onclick="acceptTransfer(${transfer.id})"
            class="btn-primary">
        تأكيد التسليم
    </button>
</td>
      </tr>
    `;
});
    }

  } catch (error) {
    console.error("Error loading transfers:", error);
  }
}

/* ============================= */
/*        IMAGE PREVIEW         */
/* ============================= */
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

/* ============================= */
/*      COMPLETE TRANSFER       */
/* ============================= */

async function acceptTransfer(transferId) {

  const fileInput = document.getElementById(`id_image_${transferId}`);
  const button = document.getElementById(`btn_${transferId}`);
  const file = fileInput.files[0];

  if (!file) {
    alert("يرجى اختيار صورة الهوية أولاً");
    return;
  }

  // منع الضغط المكرر
  button.disabled = true;
  button.innerText = "جاري المعالجة...";

  const formData = new FormData();
  formData.append("_method", "PATCH");
  formData.append("status", "completed");
  formData.append("receiver_id_image", file);

  try {
    const res = await fetch(
      `${API_URL}/transfers/${transferId}/update-status`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (res.ok) {
      alert("تم تسليم الحوالة بنجاح");
      loadNewTransfers();
    } else {
      alert(data.message || "فشل التحديث");
      button.disabled = false;
      button.innerText = "تأكيد التسليم";
    }

  } catch (error) {
    console.error(error);
    alert("خطأ في الاتصال");
    button.disabled = false;
    button.innerText = "تأكيد التسليم";
  }
}

/* ============================= */

async function handleLogout() {
  await fetch(`${API_URL}/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  localStorage.removeItem("auth_token");
  window.location.href = "../login/login.html";
}

/* ============================= */

document.addEventListener("DOMContentLoaded", async () => {
  token = await checkAuth();
  if (!token) return;

  loadNewTransfers();
});