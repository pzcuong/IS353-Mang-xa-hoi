async function ThemTaiKhoan() {
    // set block button  
    document.getElementById("btnSave").disabled = true;
    document.getElementById("btnSave").innerHTML = "Đang lưu...";
    // blur body background
    document.getElementById("body-wrapper").style.filter = "blur(5px)";

    form = document.querySelector("#form");
    data = {
      UserID: form.querySelector("input[id=UserID]").value,
      FullName: form.querySelector("input[id=FullName]").value,
      DateOfBirth: form.querySelector("input[id=DateOfBirth]").value,
      Email: form.querySelector("input[id=Email]").value,
      Address: form.querySelector("input[id=Address]").value,
      UserType: form.querySelector("select[id=UserType]").value,
      Sex: "Male"
    }
    console.log(data)
    let response = await fetch('/admin/create_account', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      json: true
    })
  
    let result = await response.json();
    alert(result.message);

    document.getElementById("btnSave").disabled = false;
    document.getElementById("btnSave").innerHTML = "Xác nhận";
    document.getElementById("body-wrapper").style.filter = "blur(0px)";
  }