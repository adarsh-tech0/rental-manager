import { useEffect, useMemo, useState } from "react";
import "./App.css";

const initialProducts = [
  {
    id: 1,
    name: "Projector",
    rate: 100,
    unit: "hour",
    available: true,
  },
  {
    id: 2,
    name: "Camera",
    rate: 150,
    unit: "hour",
    available: true,
  },
  {
    id: 3,
    name: "Speaker",
    rate: 80,
    unit: "hour",
    available: true,
  },
];

const emptyRentalForm = {
  productId: "",
  customerName: "",
  customerPhone: "",
  customerId: "",
  expectedReturn: "",
};

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTimer(startTime, expectedReturn, currentTime) {
  const start = new Date(startTime).getTime();
  const expected = new Date(expectedReturn).getTime();
  const now = currentTime;

  const elapsedMs = Math.max(0, now - start);
  const remainingMs = expected - now;

  const elapsedMinutes = Math.floor(elapsedMs / 60000);

  let remainingMinutes = Math.floor(Math.abs(remainingMs) / 60000);

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;

  if (remainingMs >= 0) {
    const remainingHours = Math.floor(remainingMinutes / 60);
    remainingMinutes %= 60;

    return {
      elapsed: `${elapsedHours}h ${elapsedMins}m`,
      remaining: `${remainingHours}h ${remainingMinutes}m`,
      overdue: false,
      currentAmount: elapsedMs / 3600000,
    };
  }

  const overdueHours = Math.floor(remainingMinutes / 60);
  remainingMinutes %= 60;

  return {
    elapsed: `${elapsedHours}h ${elapsedMins}m`,
    remaining: `${overdueHours}h ${remainingMinutes}m overdue`,
    overdue: true,
    currentAmount: elapsedMs / 3600000,
  };
}

export default function App() {
  const [userType, setUserType] = useState(null);

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("rentalManager_products");
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [productSearch, setProductSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [rentals, setRentals] = useState(() => {
    try {
      const saved = localStorage.getItem("rentalManager_rentals");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentTime, setCurrentTime] = useState(Date.now());

  const [customerId, setCustomerId] = useState("");
  const [customerPassword, setCustomerPassword] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAuthMode, setCustomerAuthMode] = useState("login");
  const [customerAccounts, setCustomerAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("rentalManager_customerAccounts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [forgotCustomerId, setForgotCustomerId] = useState("");
  const [forgotCustomerPhone, setForgotCustomerPhone] = useState("");
  const [resetCredentials, setResetCredentials] = useState(null);
  const [newCustomerCredentials, setNewCustomerCredentials] = useState(null);
  const [customerLoggedIn, setCustomerLoggedIn] = useState(false);

  const [ownerPassword, setOwnerPassword] = useState("");
  const [ownerLoggedIn, setOwnerLoggedIn] = useState(false);

  const [rentalForm, setRentalForm] = useState(emptyRentalForm);

  const [productForm, setProductForm] = useState({
    name: "",
    rate: "",
  });

  const [showRentalForm, setShowRentalForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // Admin bottom navigation
  const [adminPage, setAdminPage] = useState("home");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Keep app data after refresh, closing the browser, or reopening the site.
  useEffect(() => {
    localStorage.setItem("rentalManager_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("rentalManager_rentals", JSON.stringify(rentals));
  }, [rentals]);

  useEffect(() => {
    localStorage.setItem(
      "rentalManager_customerAccounts",
      JSON.stringify(customerAccounts)
    );
  }, [customerAccounts]);

  const activeRentals = useMemo(
    () => rentals.filter((rental) => rental.status === "active"),
    [rentals]
  );

  const completedRentals = useMemo(
    () => rentals.filter((rental) => rental.status === "returned"),
    [rentals]
  );

  function generateCustomerId() {
    const usedNumbers = customerAccounts
      .map((customer) => Number(String(customer.customerId).replace("CUST", "")))
      .filter((number) => Number.isFinite(number));

    const rentalNumbers = rentals
      .map((rental) => Number(String(rental.customerId || "").replace("CUST", "")))
      .filter((number) => Number.isFinite(number));

    const highestNumber = Math.max(1000, ...usedNumbers, ...rentalNumbers);
    return `CUST${highestNumber + 1}`;
  }

  function generateCustomerPassword() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let password = "";

    for (let index = 0; index < 8; index += 1) {
      password += characters[Math.floor(Math.random() * characters.length)];
    }

    return password;
  }

  function registerCustomer() {
    const cleanPhone = customerPhone.replace(/\D/g, "");

    if (cleanPhone.length !== 10) {
      alert("Enter a valid 10-digit mobile number.");
      return;
    }

    const existingCustomer = customerAccounts.find(
      (customer) => customer.customerPhone === cleanPhone
    );

    if (existingCustomer) {
      alert(`This mobile number is already registered. Customer ID: ${existingCustomer.customerId}`);
      setCustomerId(existingCustomer.customerId);
      setCustomerPassword("");
      setCustomerAuthMode("login");
      return;
    }

    const newCustomer = {
      customerId: generateCustomerId(),
      customerPhone: cleanPhone,
      password: generateCustomerPassword(),
      createdAt: new Date().toISOString(),
    };

    setCustomerAccounts((previous) => [...previous, newCustomer]);
    setNewCustomerCredentials(newCustomer);
    setCustomerId(newCustomer.customerId);
    setCustomerPassword(newCustomer.password);
    setCustomerAuthMode("login");
  }

  function resetCustomerPassword() {
    const cleanCustomerId = forgotCustomerId.trim().toUpperCase();
    const cleanPhone = forgotCustomerPhone.replace(/\D/g, "");

    if (!cleanCustomerId || cleanPhone.length !== 10) {
      alert("Enter your Customer ID and registered 10-digit mobile number.");
      return;
    }

    const customerIndex = customerAccounts.findIndex(
      (customer) =>
        customer.customerId.toUpperCase() === cleanCustomerId &&
        customer.customerPhone === cleanPhone
    );

    if (customerIndex === -1) {
      alert("Customer ID and mobile number do not match our records.");
      return;
    }

    const newPassword = generateCustomerPassword();
    const customer = customerAccounts[customerIndex];
    const updatedCustomer = { ...customer, password: newPassword };

    setCustomerAccounts((previous) =>
      previous.map((item, index) =>
        index === customerIndex ? updatedCustomer : item
      )
    );

    setResetCredentials({
      customerId: customer.customerId,
      password: newPassword,
    });
    setCustomerId(customer.customerId);
    setCustomerPassword(newPassword);
    setForgotCustomerId("");
    setForgotCustomerPhone("");
  }

  function loginCustomer() {
    const cleanCustomerId = customerId.trim().toUpperCase();
    const enteredPassword = customerPassword.trim();

    if (!cleanCustomerId || !enteredPassword) {
      alert("Enter your Customer ID and password.");
      return;
    }

    const customer = customerAccounts.find(
      (item) =>
        item.customerId.toUpperCase() === cleanCustomerId &&
        item.password === enteredPassword
    );

    if (!customer) {
      alert("Invalid Customer ID or password.");
      return;
    }

    setCustomerId(customer.customerId);
    setCustomerPhone(customer.customerPhone);
    setCustomerLoggedIn(true);
    setNewCustomerCredentials(null);
  }

  function loginOwner() {
    if (ownerPassword !== "admin123") {
      alert("Invalid owner password.");
      return;
    }

    setOwnerLoggedIn(true);
  }

  function logout() {
    setUserType(null);
    setCustomerLoggedIn(false);
    setOwnerLoggedIn(false);
    setCustomerId("");
    setCustomerPassword("");
    setCustomerPhone("");
    setCustomerAuthMode("login");
    setNewCustomerCredentials(null);
    setForgotCustomerId("");
    setForgotCustomerPhone("");
    setResetCredentials(null);
    setOwnerPassword("");
    setAdminPage("home");
  }

  function handleRentalChange(event) {
    const { name, value } = event.target;

    setRentalForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function addRental(event) {
    event.preventDefault();

    if (
      !rentalForm.productId ||
      !rentalForm.customerName ||
      !rentalForm.customerPhone ||
      !rentalForm.customerId ||
      !rentalForm.expectedReturn
    ) {
      alert("Please fill all rental details.");
      return;
    }

    const product = products.find(
      (item) => item.id === Number(rentalForm.productId)
    );

    if (!product) {
      alert("Product not found.");
      return;
    }

    if (!product.available) {
      alert("This product is already rented.");
      return;
    }

    const cleanCustomerId = rentalForm.customerId.trim().toUpperCase();
    const customerAccount = customerAccounts.find(
      (customer) => customer.customerId === cleanCustomerId
    );

    if (!customerAccount) {
      alert("Customer ID not found. Register the customer first.");
      return;
    }

    const startTime = new Date();

    const expectedReturn = new Date(rentalForm.expectedReturn);

    if (expectedReturn <= startTime) {
      alert("Expected return time must be in the future.");
      return;
    }

    const rental = {
      id: Date.now(),
      productId: product.id,
      productName: product.name,
      customerName: rentalForm.customerName,
      customerPhone: customerAccount.customerPhone,
      customerId: rentalForm.customerId.trim().toUpperCase(),
      startTime: startTime.toISOString(),
      expectedReturn: expectedReturn.toISOString(),
      rate: product.rate,
      estimatedAmount:
        ((expectedReturn.getTime() - startTime.getTime()) / 3600000) *
        product.rate,
      status: "active",
      returnedAt: null,
      finalAmount: null,
    };

    setRentals((previous) => [rental, ...previous]);

    setProducts((previous) =>
      previous.map((item) =>
        item.id === product.id
          ? { ...item, available: false }
          : item
      )
    );

    setRentalForm(emptyRentalForm);
    setShowRentalForm(false);
  }

  function returnRental(rentalId) {
    const rental = rentals.find((item) => item.id === rentalId);

    if (!rental || rental.status !== "active") return;

    const returnedAt = new Date();

    const elapsedHours =
      (returnedAt.getTime() - new Date(rental.startTime).getTime()) /
      3600000;

    const finalAmount = Math.max(0, elapsedHours) * rental.rate;

    setRentals((previous) =>
      previous.map((item) =>
        item.id === rentalId
          ? {
              ...item,
              status: "returned",
              returnedAt: returnedAt.toISOString(),
              finalAmount,
            }
          : item
      )
    );

    setProducts((previous) =>
      previous.map((item) =>
        item.id === rental.productId
          ? { ...item, available: true }
          : item
      )
    );
  }

  function addProduct(event) {
    event.preventDefault();

    if (!productForm.name || !productForm.rate) {
      alert("Enter product name and hourly rate.");
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: productForm.name,
      rate: Number(productForm.rate),
      unit: "hour",
      available: true,
    };

    setProducts((previous) => [...previous, newProduct]);

    setProductForm({
      name: "",
      rate: "",
    });

    setShowProductForm(false);
  }

  function deleteProduct(productId) {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    if (!product.available) {
      alert("Cannot delete a product that is currently rented.");
      return;
    }

    setProducts((previous) =>
      previous.filter((item) => item.id !== productId)
    );
  }

  const customerRentals = rentals.filter(
    (rental) =>
      rental.customerId &&
      rental.customerId.toUpperCase() === customerId.toUpperCase()
  );

  const loggedInCustomer = customerAccounts.find(
    (customer) => customer.customerId === customerId
  );

  /* ---------------- LOGIN SELECTION ---------------- */

  if (!userType) {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <div className="brand-icon">🏠</div>

            <h1>Rental Manager</h1>

            <p className="login-subtitle">
              Equipment rental management system
            </p>

            <div className="login-options">
              <button
                className="login-option"
                onClick={() => setUserType("customer")}
              >
                <span className="login-option-icon">👤</span>

                <div>
                  <strong>Customer</strong>
                  <small>Login using Customer ID</small>
                </div>
              </button>

              <button
                className="login-option"
                onClick={() => setUserType("owner")}
              >
                <span className="login-option-icon">🔐</span>

                <div>
                  <strong>Owner / Admin</strong>
                  <small>Manage rentals and products</small>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- CUSTOMER LOGIN ---------------- */

  if (userType === "customer" && !customerLoggedIn && customerAuthMode !== "forgot") {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <button
              className="back-button"
              onClick={() => {
                setCustomerId("");
                setCustomerPassword("");
                setCustomerPhone("");
                setCustomerAuthMode("login");
                setNewCustomerCredentials(null);
                setForgotCustomerId("");
                setForgotCustomerPhone("");
                setResetCredentials(null);
                setUserType(null);
              }}
            >
              ← Back
            </button>

            <div className="brand-icon">👤</div>

            <h1>Customer Login</h1>

            <p className="login-subtitle">
              {customerAuthMode === "register"
                ? "Use your mobile number to create your customer account"
                : "Login using your Customer ID and password"}
            </p>

            {customerAuthMode === "register" ? (
              <>
                <div className="form-group">
                  <label>Mobile Number</label>

                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength="10"
                    placeholder="10 digit mobile number"
                    value={customerPhone}
                    onChange={(event) =>
                      setCustomerPhone(event.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        registerCustomer();
                      }
                    }}
                  />
                </div>

                <button
                  className="primary-button full-width"
                  onClick={registerCustomer}
                >
                  GET CUSTOMER ID & PASSWORD
                </button>

                <button
                  className="secondary-button full-width"
                  onClick={() => setCustomerAuthMode("login")}
                >
                  BACK TO LOGIN
                </button>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Customer ID</label>

                  <input
                    type="text"
                    placeholder="Example: CUST1001"
                    value={customerId}
                    onChange={(event) =>
                      setCustomerId(event.target.value.toUpperCase())
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>

                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={customerPassword}
                    onChange={(event) => setCustomerPassword(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        loginCustomer();
                      }
                    }}
                  />
                </div>

                {newCustomerCredentials && (
                  <div className="credential-box">
                    <strong>Account created successfully</strong>
                    <p>Save these details for future login.</p>
                    <div><span>Customer ID</span><strong>{newCustomerCredentials.customerId}</strong></div>
                    <div><span>Password</span><strong>{newCustomerCredentials.password}</strong></div>
                  </div>
                )}

                {resetCredentials && (
                  <div className="credential-box">
                    <strong>Password reset successfully</strong>
                    <p>Save your new password for future login.</p>
                    <div><span>Customer ID</span><strong>{resetCredentials.customerId}</strong></div>
                    <div><span>New Password</span><strong>{resetCredentials.password}</strong></div>
                  </div>
                )}

                <button
                  className="primary-button full-width"
                  onClick={loginCustomer}
                >
                  LOGIN
                </button>

                <button
                  className="text-button full-width"
                  onClick={() => {
                    setCustomerAuthMode("forgot");
                    setCustomerPassword("");
                    setNewCustomerCredentials(null);
                    setResetCredentials(null);
                  }}
                >
                  FORGOT PASSWORD?
                </button>

                <button
                  className="secondary-button full-width"
                  onClick={() => {
                    setCustomerAuthMode("register");
                    setCustomerPassword("");
                    setNewCustomerCredentials(null);
                  }}
                >
                  FIRST TIME? REGISTER WITH MOBILE NUMBER
                </button>

                <p className="demo-note">
                  Your mobile number is used only to create the account. Future logins use Customer ID + password.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- FORGOT CUSTOMER PASSWORD ---------------- */

  if (userType === "customer" && !customerLoggedIn && customerAuthMode === "forgot") {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <button
              className="back-button"
              onClick={() => {
                setCustomerAuthMode("login");
                setForgotCustomerId("");
                setForgotCustomerPhone("");
                setResetCredentials(null);
              }}
            >
              ← Back to Login
            </button>

            <div className="brand-icon">🔑</div>

            <h1>Forgot Password</h1>

            <p className="login-subtitle">
              Verify your Customer ID and registered mobile number to create a new password.
            </p>

            <div className="form-group">
              <label>Customer ID</label>
              <input
                type="text"
                placeholder="Example: CUST1001"
                value={forgotCustomerId}
                onChange={(event) =>
                  setForgotCustomerId(event.target.value.toUpperCase())
                }
              />
            </div>

            <div className="form-group">
              <label>Registered Mobile Number</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength="10"
                placeholder="10 digit mobile number"
                value={forgotCustomerPhone}
                onChange={(event) =>
                  setForgotCustomerPhone(event.target.value.replace(/\D/g, ""))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    resetCustomerPassword();
                  }
                }}
              />
            </div>

            <button
              className="primary-button full-width"
              onClick={resetCustomerPassword}
            >
              RESET PASSWORD
            </button>

            {resetCredentials && (
              <div className="credential-box">
                <strong>New password generated</strong>
                <p>Save these details before leaving this page.</p>
                <div><span>Customer ID</span><strong>{resetCredentials.customerId}</strong></div>
                <div><span>New Password</span><strong>{resetCredentials.password}</strong></div>
              </div>
            )}

            <p className="demo-note">
              This recovery method is for the current local prototype. A production version should verify the mobile number with OTP or use a secure backend before allowing a password reset.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- OWNER LOGIN ---------------- */

  if (userType === "owner" && !ownerLoggedIn) {
    return (
      <div className="app">
        <div className="login-page">
          <div className="login-card">
            <button
              className="back-button"
              onClick={() => setUserType(null)}
            >
              ← Back
            </button>

            <div className="brand-icon">🔐</div>

            <h1>Owner Login</h1>

            <p className="login-subtitle">
              Enter owner password
            </p>

            <div className="form-group">
              <label>Password</label>

              <input
                type="password"
                placeholder="Password"
                value={ownerPassword}
                onChange={(event) =>
                  setOwnerPassword(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loginOwner();
                  }
                }}
              />
            </div>

            <button
              className="primary-button full-width"
              onClick={loginOwner}
            >
              LOGIN
            </button>

            <p className="demo-note">
              Demo password: <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     CUSTOMER DASHBOARD
     ============================================================ */

  if (userType === "customer" && customerLoggedIn) {
    return (
      <div className="app">
        <header className="top-header">
          <div>
            <h1>Rental Manager</h1>
            <span>Customer Dashboard</span>
          </div>

          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </header>

        <main className="dashboard">
          <section className="welcome-card">
            <div>
              <span className="section-label">CUSTOMER</span>
              <h2>Welcome, {customerRentals[0]?.customerName || "Customer"}</h2>
              <p>Customer ID: {customerId}</p>
              <p>Mobile: {loggedInCustomer?.customerPhone || customerRentals[0]?.customerPhone || "-"}</p>
            </div>
          </section>

          <div className="section-heading">
            <div>
              <h2>My Active Rentals</h2>
              <p>Live rental information</p>
            </div>
          </div>

          {customerRentals.filter((r) => r.status === "active").length ===
          0 ? (
            <div className="empty-state">
              <div>📦</div>
              <h3>No active rentals</h3>
              <p>You currently have no rented equipment.</p>
            </div>
          ) : (
            <div className="rental-grid">
              {customerRentals
                .filter((rental) => rental.status === "active")
                .map((rental) => {
                  const timer = getTimer(
                    rental.startTime,
                    rental.expectedReturn,
                    currentTime
                  );

                  return (
                    <div className="rental-card" key={rental.id}>
                      <div className="rental-card-header">
                        <div>
                          <span className="section-label">EQUIPMENT</span>
                          <h3>{rental.productName}</h3>
                        </div>

                        <span
                          className={
                            timer.overdue
                              ? "status-badge overdue"
                              : "status-badge active"
                          }
                        >
                          {timer.overdue ? "OVERDUE" : "ACTIVE"}
                        </span>
                      </div>

                      <div className="timer-box">
                        <div>
                          <span>TIME TAKEN</span>
                          <strong>{timer.elapsed}</strong>
                        </div>

                        <div>
                          <span>
                            {timer.overdue ? "OVERDUE BY" : "TIME LEFT"}
                          </span>

                          <strong>
                            {timer.remaining}
                          </strong>
                        </div>
                      </div>

                      <div className="rental-details">
                        <div>
                          <span>Start Time</span>
                          <strong>
                            {formatDateTime(rental.startTime)}
                          </strong>
                        </div>

                        <div>
                          <span>Expected Return</span>
                          <strong>
                            {formatDateTime(rental.expectedReturn)}
                          </strong>
                        </div>

                        <div>
                          <span>Rate</span>
                          <strong>
                            {formatCurrency(rental.rate)}/hr
                          </strong>
                        </div>

                        <div>
                          <span>Current Amount</span>
                          <strong>
                            {formatCurrency(
                              timer.currentAmount * rental.rate
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          <div className="section-heading">
            <div>
              <h2>Rental History</h2>
              <p>Your previous rentals</p>
            </div>
          </div>

          {customerRentals.filter((r) => r.status === "returned").length ===
          0 ? (
            <div className="empty-state small">
              <p>No previous rentals.</p>
            </div>
          ) : (
            <div className="history-list">
              {customerRentals
                .filter((rental) => rental.status === "returned")
                .map((rental) => (
                  <div className="history-item" key={rental.id}>
                    <div>
                      <strong>{rental.productName}</strong>

                      <span>
                        {formatDateTime(rental.startTime)}
                      </span>
                    </div>

                    <strong>
                      {formatCurrency(rental.finalAmount)}
                    </strong>
                  </div>
                ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ============================================================
     OWNER / ADMIN DASHBOARD
     ============================================================ */

  return (
    <div className="app">
      <header className="top-header">
        <div>
          <h1>Rental Manager</h1>
          <span>Owner / Admin Dashboard</span>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard admin-page">
        {/* =====================================================
            ADMIN HOME
            ===================================================== */}

        {adminPage === "home" && (
  <>
    {/* ADMIN WELCOME */}
    <section className="admin-welcome">
      <div>
        <span className="welcome-label">OWNER DASHBOARD</span>

        <h2>Good afternoon, Admin 👋</h2>

        <p>
          Here's what's happening with your rental business today.
        </p>
      </div>

      <button
        className="welcome-rental-button"
        onClick={() => setShowRentalForm(true)}
      >
        <span>＋</span>
        New Rental
      </button>
    </section>

    {/* STATISTICS */}
    <section className="pro-stats-grid">

      <div className="pro-stat-card">
        <div className="pro-stat-top">
          <div className="pro-stat-icon products-icon">
            📦
          </div>

          <span className="stat-label">
            PRODUCTS
          </span>
        </div>

        <strong>{products.length}</strong>

        <p>Total equipment</p>
      </div>


      <div className="pro-stat-card">
        <div className="pro-stat-top">
          <div className="pro-stat-icon available-icon">
            ✓
          </div>

          <span className="stat-label">
            AVAILABLE
          </span>
        </div>

        <strong>
          {products.filter((p) => p.available).length}
        </strong>

        <p>Ready for rental</p>
      </div>


      <div className="pro-stat-card">
        <div className="pro-stat-top">
          <div className="pro-stat-icon rented-icon">
            ↗
          </div>

          <span className="stat-label">
            CURRENTLY RENTED
          </span>
        </div>

        <strong>
          {products.filter((p) => !p.available).length}
        </strong>

        <p>Active equipment</p>
      </div>


      <div className="pro-stat-card">
        <div className="pro-stat-top">
          <div className="pro-stat-icon history-icon">
            ₹
          </div>

          <span className="stat-label">
            TOTAL RENTALS
          </span>
        </div>

        <strong>{rentals.length}</strong>

        <p>All transactions</p>
      </div>

    </section>


    {/* ACTIVE RENTALS */}
    <section className="pro-rentals-section">

      <div className="pro-section-header">

        <div>
          <span className="section-label">
            LIVE ACTIVITY
          </span>

          <h2>Active Rentals</h2>

          <p>
            Equipment currently rented by customers
          </p>
        </div>

        <div className="active-count">
          <span></span>
          {activeRentals.length} Active
        </div>

      </div>


      {activeRentals.length === 0 ? (

        <div className="pro-empty-state">

          <div className="empty-icon">
            📦
          </div>

          <h3>No active rentals</h3>

          <p>
            All equipment is currently available.
          </p>

          <button
            className="primary-button"
            onClick={() => setShowRentalForm(true)}
          >
            + Start New Rental
          </button>

        </div>

      ) : (

        <div className="pro-rental-grid">

          {activeRentals.map((rental) => {

            const timer = getTimer(
              rental.startTime,
              rental.expectedReturn,
              currentTime
            );

            return (
              <article
                className="pro-rental-card"
                key={rental.id}
              >

                {/* CARD TOP */}
                <div className="pro-rental-top">

                  <div className="equipment-avatar">
                    📦
                  </div>

                  <div className="equipment-title">
                    <span>EQUIPMENT</span>

                    <h3>
                      {rental.productName}
                    </h3>
                  </div>

                  <span
                    className={
                      timer.overdue
                        ? "pro-status overdue-status"
                        : "pro-status active-status"
                    }
                  >
                    <i></i>

                    {timer.overdue
                      ? "OVERDUE"
                      : "ACTIVE"}
                  </span>

                </div>


                {/* CUSTOMER */}
                <div className="pro-customer">

                  <div className="customer-avatar">
                    {rental.customerName
                      ? rental.customerName
                          .charAt(0)
                          .toUpperCase()
                      : "C"}
                  </div>

                  <div>
                    <strong>
                      {rental.customerName}
                    </strong>

                    <span>
                      {rental.customerPhone}
                    </span>
                  </div>

                </div>


                {/* TIME */}
                <div className="pro-time-box">

                  <div>
                    <span>TIME TAKEN</span>

                    <strong>
                      {timer.elapsed}
                    </strong>
                  </div>

                  <div className="time-divider"></div>

                  <div>
                    <span>
                      {timer.overdue
                        ? "OVERDUE BY"
                        : "TIME LEFT"}
                    </span>

                    <strong
                      className={
                        timer.overdue
                          ? "overdue-text"
                          : ""
                      }
                    >
                      {timer.remaining}
                    </strong>
                  </div>

                </div>


                {/* DETAILS */}
                <div className="pro-rental-details">

                  <div>
                    <span>HOURLY RATE</span>

                    <strong>
                      {formatCurrency(
                        rental.rate
                      )}
                      /hr
                    </strong>
                  </div>

                  <div>
                    <span>CURRENT AMOUNT</span>

                    <strong className="amount-value">
                      {formatCurrency(
                        timer.currentAmount *
                          rental.rate
                      )}
                    </strong>
                  </div>

                </div>


                {/* RETURN */}
                <button
                  className="pro-return-button"
                  onClick={() =>
                    returnRental(rental.id)
                  }
                >
                  Return Equipment
                  <span>→</span>
                </button>

              </article>
            );
          })}

        </div>
      )}

    </section>
  </>
)}

        {/* =====================================================
            PRODUCTS PAGE
            ===================================================== */}

        {adminPage === "products" && (
  <>
<div className="products-page-header">
  <div>
    <span className="section-label">INVENTORY</span>
    <h2>Products</h2>
    <p>Manage your rental equipment and availability.</p>
  </div>

  <div className="products-actions">
    <div className="product-search-box">
      <span>⌕</span>

      <input
        type="text"
        placeholder="Search products..."
        value={productSearch}
        onChange={(e) => setProductSearch(e.target.value)}
      />

      {productSearch && (
        <button
          className="clear-search-button"
          onClick={() => setProductSearch("")}
        >
          ×
        </button>
      )}
    </div>

    <button
      className="welcome-rental-button products-add-button"
      onClick={() => setShowProductForm(true)}
    >
      <span>＋</span>
      Add Product
    </button>
  </div>
</div>

    <section className="products-panel">

      <div className="products-toolbar">
        <div className="products-summary">
          <strong>{products.length}</strong>
          <span>Total products</span>
        </div>

        <div className="products-summary available-summary">
          <strong>
            {products.filter((p) => p.available).length}
          </strong>
          <span>Available</span>
        </div>

        <div className="products-summary rented-summary">
          <strong>
            {products.filter((p) => !p.available).length}
          </strong>
          <span>Currently rented</span>
        </div>
      </div>


      <div className="products-table-wrapper">

        <table className="products-table">

          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>RATE</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>

          <tbody>

            {products
  .filter((product) =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )
  .map((product) => (

              <tr key={product.id}>

                <td>
                  <div className="table-product">

                    <div className="table-product-icon">
                      📦
                    </div>

                    <div>
                      <strong>
                        {product.name}
                      </strong>

                      <span>
                        Rental equipment
                      </span>
                    </div>

                  </div>
                </td>


                <td>
                  <div className="product-rate">
                    {formatCurrency(product.rate)}
                    <span>/hour</span>
                  </div>
                </td>


                <td>

                  {product.available ? (

                    <span className="product-status available-status">
                      <i></i>
                      Available
                    </span>

                  ) : (

                    <span className="product-status rented-product-status">
                      <i></i>
                      Currently Rented
                    </span>

                  )}

                </td>


                <td>

                  <button
                    className="table-delete-button"
                    onClick={() =>
                      deleteProduct(product.id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>


        {products.length === 0 && (

          <div className="products-empty">

            <div>📦</div>

            <h3>No products yet</h3>

            <p>
              Add your first rental equipment to get started.
            </p>

            <button
              className="primary-button"
              onClick={() => setShowProductForm(true)}
            >
              + Add Product
            </button>

          </div>

        )}

      </div>

    </section>
  </>
)}
        {/* =====================================================
            RENTAL HISTORY PAGE
            ===================================================== */}

        {adminPage === "history" && (
  <>
    <div className="history-page-header">
      <div>
        <span className="section-label">TRANSACTIONS</span>
        <h2>Rental History</h2>
        <p>View and search all completed rental transactions.</p>
      </div>

      <div className="history-search-box">
        <span>⌕</span>

        <input
          type="text"
          placeholder="Search rentals..."
          value={historySearch}
          onChange={(event) =>
            setHistorySearch(event.target.value)
          }
        />

        {historySearch && (
          <button
            className="clear-search-button"
            onClick={() => setHistorySearch("")}
          >
            ×
          </button>
        )}
      </div>
    </div>

    <section className="content-card">

      {/* HISTORY SUMMARY */}

      <div className="history-summary">
        <div>
          <strong>{completedRentals.length}</strong>
          <span>Completed Rentals</span>
        </div>

        <div>
          <strong>
            {formatCurrency(
              completedRentals.reduce(
                (total, rental) =>
                  total + Number(rental.finalAmount || 0),
                0
              )
            )}
          </strong>
          <span>Total Revenue</span>
        </div>
      </div>

      {/* HISTORY TABLE */}

      {(() => {
        const search = historySearch
          .toLowerCase()
          .trim();

        const filteredRentals = completedRentals.filter(
          (rental) =>
            !search ||
            rental.productName
              .toLowerCase()
              .includes(search) ||
            rental.customerName
              .toLowerCase()
              .includes(search) ||
            rental.customerPhone
              .toLowerCase()
              .includes(search)
        );

        if (filteredRentals.length === 0) {
          return (
            <div className="empty-state">
              <div>📋</div>

              <h3>
                {historySearch
                  ? "No matching rentals"
                  : "No rental history"}
              </h3>

              <p>
                {historySearch
                  ? "Try a different product name, customer name, or phone number."
                  : "Completed rentals will appear here."}
              </p>
            </div>
          );
        }

        return (
          <div className="history-table-wrapper">
            <table className="history-table">

              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>CUSTOMER</th>
                  <th>PHONE</th>
                  <th>START</th>
                  <th>RETURNED</th>
                  <th>RATE</th>
                  <th>FINAL AMOUNT</th>
                </tr>
              </thead>

              <tbody>
                {filteredRentals.map((rental) => (
                  <tr key={rental.id}>

                    <td>
                      <div className="history-product">
                        <div className="history-product-icon">
                          📦
                        </div>

                        <div>
                          <strong>
                            {rental.productName}
                          </strong>

                          <span>
                            Completed rental
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {rental.customerName}
                      </strong>
                    </td>

                    <td>
                      {rental.customerId || "-"}
                    </td>

                    <td>
                      {rental.customerPhone}
                    </td>

                    <td>
                      {formatDateTime(
                        rental.startTime
                      )}
                    </td>

                    <td>
                      {formatDateTime(
                        rental.returnedAt
                      )}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(rental.rate)}
                      </strong>
                      <span className="table-unit">
                        /hr
                      </span>
                    </td>

                    <td>
                      <strong className="history-amount">
                        {formatCurrency(
                          rental.finalAmount
                        )}
                      </strong>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        );
      })()}

    </section>
  </>
)}

      </main>

      {/* ========================================================
          NEW RENTAL MODAL
          ======================================================== */}

      {showRentalForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowRentalForm(false)}
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>New Rental</h2>
                <p>Rent equipment to a customer</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowRentalForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={addRental}>

              <div className="form-group">
                <label>Product</label>

                <select
                  name="productId"
                  value={rentalForm.productId}
                  onChange={handleRentalChange}
                >
                  <option value="">
                    Select product
                  </option>

                  {products
                    .filter((product) => product.available)
                    .map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} -{" "}
                        {formatCurrency(product.rate)}/hr
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Customer Name</label>

                <input
                  type="text"
                  name="customerName"
                  placeholder="Customer name"
                  value={rentalForm.customerName}
                  onChange={handleRentalChange}
                />
              </div>

              <div className="form-group">
                <label>Customer ID</label>

                <input
                  type="text"
                  name="customerId"
                  placeholder="Example: CUST1001"
                  value={rentalForm.customerId}
                  onChange={(event) =>
                    setRentalForm((previous) => ({
                      ...previous,
                      customerId: event.target.value.toUpperCase(),
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Customer Mobile</label>

                <input
                  type="tel"
                  name="customerPhone"
                  placeholder="10 digit mobile number"
                  value={rentalForm.customerPhone}
                  onChange={handleRentalChange}
                />
              </div>

              <div className="form-group">
                <label>Expected Return</label>

                <input
                  type="datetime-local"
                  name="expectedReturn"
                  value={rentalForm.expectedReturn}
                  onChange={handleRentalChange}
                />
              </div>

              <button
                type="submit"
                className="primary-button full-width"
              >
                START RENTAL
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD PRODUCT MODAL
          ======================================================== */}

      {showProductForm && (
        <div
          className="modal-overlay"
          onClick={() => setShowProductForm(false)}
        >
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Add Product</h2>
                <p>Add new rental equipment</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowProductForm(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={addProduct}>

              <div className="form-group">
                <label>Product Name</label>

                <input
                  type="text"
                  placeholder="Example: Tripod"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label>Hourly Rate</label>

                <input
                  type="number"
                  min="0"
                  placeholder="Example: 50"
                  value={productForm.rate}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      rate: event.target.value,
                    }))
                  }
                />
              </div>

              <button
                type="submit"
                className="primary-button full-width"
              >
                ADD PRODUCT
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADMIN BOTTOM NAVIGATION
          ======================================================== */}

      <nav className="admin-bottom-nav">
        <button
          className={
            adminPage === "home"
              ? "admin-nav-button active"
              : "admin-nav-button"
          }
          onClick={() => setAdminPage("home")}
        >
          <span>🏠</span>
          <small>Home</small>
        </button>

        <button
          className={
            adminPage === "products"
              ? "admin-nav-button active"
              : "admin-nav-button"
          }
          onClick={() => setAdminPage("products")}
        >
          <span>📦</span>
          <small>Products</small>
        </button>

        <button
          className={
            adminPage === "history"
              ? "admin-nav-button active"
              : "admin-nav-button"
          }
          onClick={() => setAdminPage("history")}
        >
          <span>📋</span>
          <small>Rental History</small>
        </button>
      </nav>
    </div>
  );
}
