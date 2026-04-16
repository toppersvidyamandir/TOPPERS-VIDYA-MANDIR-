// Database Initialize: Admin ID aur Password local storage mein set karna
if(!localStorage.getItem('tvm_admin_user')) localStorage.setItem('tvm_admin_user', 'admin');
if(!localStorage.getItem('tvm_admin_pass')) localStorage.setItem('tvm_admin_pass', 'toppers@2026');

const SECRET_PIN = "12345"; // Yeh PIN Forgot Password ke kaam aayega
let currentOpenProfileId = null; 

window.onload = function() {
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString();
    loadStudents();
};

// --- LOGIN & PASSWORD MANAGEMENT ---
function checkLogin() {
    const savedUser = localStorage.getItem('tvm_admin_user');
    const savedPass = localStorage.getItem('tvm_admin_pass');
    
    if (document.getElementById('username').value === savedUser && document.getElementById('password').value === savedPass) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        showToast("Access Granted!");
    } else {
        showToast("Incorrect Details", "error");
    }
}

function changePassword() {
    const oldP = document.getElementById('oldPass').value;
    const newP = document.getElementById('newPass').value;
    const savedPass = localStorage.getItem('tvm_admin_pass');

    if(oldP === savedPass) {
        if(newP.length >= 6) {
            localStorage.setItem('tvm_admin_pass', newP);
            showToast("Password Updated Successfully!");
            closeModal('changePassModal');
        } else {
            showToast("New Password must be at least 6 characters", "error");
        }
    } else {
        showToast("Old Password is wrong", "error");
    }
}

function resetPassword() {
    const pin = document.getElementById('secretPin').value;
    const newP = document.getElementById('newPassForgot').value;

    if(pin === SECRET_PIN) {
        if(newP.length >= 6) {
            localStorage.setItem('tvm_admin_pass', newP);
            showToast("Password Reset Successful! Login now.");
            closeModal('forgotPassModal');
        } else {
            showToast("Password must be at least 6 characters", "error");
        }
    } else {
        showToast("Invalid Secret PIN", "error");
    }
}

// --- UI & NAVIGATION ---
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(id).classList.add('active-section');
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

function showModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function toggleTheme() { document.body.toggleAttribute('data-theme'); }

// --- STUDENT MANAGEMENT ---
document.getElementById('studentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const student = {
        id: Date.now(),
        name: document.getElementById('name').value,
        dob: document.getElementById('dob').value,
        fatherName: document.getElementById('fatherName').value,
        motherName: document.getElementById('motherName').value,
        phone1: document.getElementById('phone1').value,
        phone2: document.getElementById('phone2').value || "N/A",
        address: document.getElementById('address').value,
        docs: document.getElementById('docs').value || "No Document Provided",
        feeHistory: [] 
    };

    let students = JSON.parse(localStorage.getItem('tvm_erp_data')) || [];
    students.push(student);
    localStorage.setItem('tvm_erp_data', JSON.stringify(students));

    showToast("Registration Successful!");
    this.reset();
    loadStudents();
    showSection('student-list');
});

function loadStudents() {
    const students = JSON.parse(localStorage.getItem('tvm_erp_data')) || [];
    document.getElementById('studentDirectoryBody').innerHTML = '';
    document.getElementById('attendanceList').innerHTML = '';

    students.forEach(s => {
        document.getElementById('studentDirectoryBody').innerHTML += `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.fatherName}</td>
                <td><i class="fas fa-phone"></i> ${s.phone1}</td>
                <td>
                    <button class="btn-primary" style="width:auto; padding:6px 12px; font-size:12px;" onclick="openProfile(${s.id})">
                        Open Profile
                    </button>
                </td>
            </tr>`;

        document.getElementById('attendanceList').innerHTML += `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td><input type="checkbox" style="transform: scale(1.5);"></td>
            </tr>`;
    });
}

// --- PROFILE & FEE LOGIC ---
function openProfile(id) {
    const students = JSON.parse(localStorage.getItem('tvm_erp_data')) || [];
    const student = students.find(s => s.id === id);
    if(!student) return;

    currentOpenProfileId = id; 

    document.getElementById('pName').innerText = student.name;
    document.getElementById('pId').innerText = "TVM-" + student.id.toString().slice(-4);
    document.getElementById('pDob').innerText = student.dob;
    document.getElementById('pFather').innerText = student.fatherName;
    document.getElementById('pMother').innerText = student.motherName;
    document.getElementById('pPhone1').innerText = student.phone1;
    document.getElementById('pPhone2').innerText = student.phone2;
    document.getElementById('pAddress').innerText = student.address;
    document.getElementById('pDocs').innerText = student.docs;

    renderFeeHistory(student.feeHistory);
    showModal('profileModal');
}

function payFee() {
    const category = document.getElementById('feeCategory').value;
    const month = document.getElementById('feeMonth').value;
    const amount = document.getElementById('feeAmount').value;

    if(!month || !amount) {
        showToast("Month and Amount are required!", "error");
        return;
    }

    let students = JSON.parse(localStorage.getItem('tvm_erp_data')) || [];
    let studentIndex = students.findIndex(s => s.id === currentOpenProfileId);
    
    const newPayment = {
        type: category, // Kaunsi fee jama ki hai
        month: new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        datePaid: new Date().toLocaleDateString(),
        amount: Number(amount)
    };

    students[studentIndex].feeHistory.push(newPayment);
    localStorage.setItem('tvm_erp_data', JSON.stringify(students));

    showToast(`${category} Added!`);
    document.getElementById('feeMonth').value = '';
    document.getElementById('feeAmount').value = '';
    
    renderFeeHistory(students[studentIndex].feeHistory); 
}

function renderFeeHistory(historyArray) {
    const tbody = document.getElementById('feeHistoryBody');
    tbody.innerHTML = '';

    if(historyArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">No payment history found.</td></tr>';
        return;
    }

    // Latest fee upar dikhane ke liye reverse kiya hai
    [...historyArray].reverse().forEach(record => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${record.month}</strong></td>
                <td style="color:var(--primary); font-size:12px;">${record.type}</td>
                <td style="color:var(--success); font-weight:bold;">₹${record.amount}</td>
                <td style="font-size:12px; color:var(--gray);">${record.datePaid}</td>
            </tr>`;
    });
}

function deleteCurrentStudent() {
    if(confirm("Permanently Delete this Student? This action cannot be undone.")) {
        let students = JSON.parse(localStorage.getItem('tvm_erp_data')) || [];
        students = students.filter(s => s.id !== currentOpenProfileId);
        localStorage.setItem('tvm_erp_data', JSON.stringify(students));
        
        closeModal('profileModal');
        loadStudents();
        showToast("Student Removed Completely!", "error");
    }
}

function searchStudent() {
    let filter = document.getElementById('searchInput').value.toUpperCase();
    let trs = document.getElementById('studentDirectoryBody').getElementsByTagName('tr');
    for (let i = 0; i < trs.length; i++) {
        let td = trs[i].getElementsByTagName("td")[0];
        if (td) {
            trs[i].style.display = (td.textContent || td.innerText).toUpperCase().indexOf(filter) > -1 ? "" : "none";
        }
    }
}

function showToast(msg, type="success") {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.style.backgroundColor = type === "error" ? "var(--danger)" : "var(--success)";
    toast.className = "toast show";
    setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
}
