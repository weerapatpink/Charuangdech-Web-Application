document.addEventListener("DOMContentLoaded", function () {
    // ตรวจสอบว่าเป็น menu.html
    if (document.querySelector(".menu-container")) {
        setupMenuButtons();
    }

    // ตรวจสอบว่าเป็น cart.html
    if (document.querySelector(".cart-container") && document.querySelector(".checkout-btn")) {
        loadCart();
        document.querySelector(".checkout-btn").addEventListener("click", goToCheckout);
    }

    // ตรวจสอบว่าเป็น checkout.html
    if (document.querySelector(".cart-container") && document.querySelector(".total-price")) {
        loadCheckout();
    }

    // ตรวจสอบว่ามีฟอร์มยืนยันออเดอร์
    const orderForm = document.getElementById("order-form");
    if (orderForm) {
        orderForm.addEventListener("submit", function (event) {
            event.preventDefault();
            confirmOrder();
        });
    }
});

// ✅ 1. ฟังก์ชันเพิ่มสินค้าลงตะกร้า
function setupMenuButtons() {
    document.querySelectorAll(".menu-item button").forEach(button => {
        button.addEventListener("click", function () {
            const item = this.closest(".menu-item");
            const name = item.querySelector("h3").innerText;
            const price = parseFloat(item.querySelector(".price").innerText.replace(" บาท", ""));
            addToCart(name, price);
        });
    });
}

function addToCart(name, price) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let found = cart.find(item => item.name === name);
    if (found) {
        found.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`เพิ่ม ${name} ลงตะกร้าแล้ว!`);
}

// ✅ 2. ฟังก์ชันโหลดสินค้าลง cart.html
function loadCart() {
    const cartContainer = document.querySelector(".cart-items");
    if (!cartContainer) return;

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cartContainer.innerHTML = "";

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>ตะกร้าสินค้าว่างเปล่า</p>";
    } else {
        cart.forEach((item, index) => {
            let cartItem = document.createElement("div");
            cartItem.classList.add("cart-item");
            cartItem.innerHTML = `
                <span class="name">${item.name}</span>
                <span class="price">${item.price} บาท</span>
                <span class="quantity">x ${item.quantity}</span>
                <button class="remove-btn" data-index="${index}">ลบ</button>
            `;
            cartContainer.appendChild(cartItem);
        });

        document.querySelectorAll(".remove-btn").forEach(button => {
            button.addEventListener("click", function () {
                removeFromCart(this.dataset.index);
            });
        });
    }
}

// ✅ 3. ฟังก์ชันลบสินค้าออกจากตะกร้า
function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// ✅ 4. ฟังก์ชันไปหน้า checkout.html
function goToCheckout() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.length === 0) {
        alert("ตะกร้าสินค้าว่างเปล่า");
        return;
    }

    localStorage.setItem("checkoutCart", JSON.stringify(cart));
    window.location.href = "checkout.html";
}

// ✅ 5. ฟังก์ชันโหลด checkout.html และคำนวณยอดรวม
function loadCheckout() {
    const cartContainer = document.querySelector(".cart-items");
    const totalPriceElement = document.querySelector(".total-price");

    if (!cartContainer || !totalPriceElement) return;

    let cart = JSON.parse(localStorage.getItem("checkoutCart")) || [];
    cartContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>ไม่มีสินค้าในตะกร้า</p>";
        totalPriceElement.innerText = "ยอดรวม: 0 บาท";
        return;
    }

    cart.forEach(item => {
        let price = parseFloat(item.price) || 0;
        let quantity = parseInt(item.quantity) || 0;
        let itemTotal = price * quantity;
        total += itemTotal;

        let cartItem = document.createElement("div");
        cartItem.classList.add("cart-item");
        cartItem.innerHTML = `
            <span class="name">${item.name}</span>
            <span class="quantity">x ${quantity}</span>
            <span class="price">${itemTotal} บาท</span>
        `;
        cartContainer.appendChild(cartItem);
    });

    totalPriceElement.innerText = `ยอดรวม: ${total} บาท`;
}

// ✅ 6. ฟังก์ชันยืนยันคำสั่งซื้อ & ส่ง LINE Notify
function confirmOrder() {
    let name = document.getElementById("customer-name").value.trim();
    let phone = document.getElementById("customer-phone").value.trim();
    let address = document.getElementById("customer-address").value.trim();
    let cart = JSON.parse(localStorage.getItem("checkoutCart")) || [];

    if (!name || !phone || !address || cart.length === 0) {
        alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }

    let orderDetails = `📦 คำสั่งซื้อใหม่\n👤 ลูกค้า: ${name}\n📞 เบอร์โทร: ${phone}\n📍 ที่อยู่: ${address}\n\n🛒 รายการสินค้า:\n`;
    let total = 0;

    cart.forEach(item => {
        let itemTotal = item.price * item.quantity;
        total += itemTotal;
        orderDetails += `- ${item.name} x ${item.quantity} = ${itemTotal} บาท\n`;
    });

    orderDetails += `\n💰 ยอดรวม: ${total} บาท`;

    sendLineMessage("Uea89d2e337e2180677da128e5e0faeb8", orderDetails);

    alert("สั่งซื้อสำเร็จ! ขอบคุณที่ใช้บริการ");
    localStorage.removeItem("cart");
    localStorage.removeItem("checkoutCart");
    window.location.href = "index.html";
}

// // ✅ 7. ฟังก์ชันส่งข้อความไป LINE Messaging API
async function sendLineMessage(userId, message) {
    try {
        const response = await fetch("http://localhost:3000/send-line-message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ userId, message })
        });

        const data = await response.json();
        if (data.success) {
            console.log("✅ ส่งข้อความสำเร็จ!");
        } else {
            console.error("❌ ส่งข้อความผิดพลาด", data.error);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
