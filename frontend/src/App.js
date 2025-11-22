import React, { Component } from 'react';
import './App.css';

// Use environment variable for API URL (set in docker-compose.yml)
// Falls back to localhost for local development
const serverURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/';

class CustomerApp extends Component {
  constructor() {
    super();
    this.state = {
      name: null,
      timestamp: null,
      customers: null,
      customer: null,
      loading: false
    };
  }

  async getCustomer(customer) {
    this.setState({ customer })
  }

  async getCustomers() {
    const userName = document.getElementById("name").value;
    if (!userName || userName === "") {
      alert("Proszę podać swoje imię");
      return;
    }

    this.setState({ loading: true });

    const axios = require('axios');
    const server = axios.create({
      baseURL: serverURL
    });

    try {
      const response = await server.post('/', { name: userName });
      const { name, timestamp, customers } = response.data;
      this.setState({ name, timestamp, customers, loading: false });
    } catch (error) {
      alert("Błąd: " + error);
      this.setState({ loading: false });
    }
  }

  getSizeColor(size) {
    switch (size) {
      case 'Small': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Big': return '#8b5cf6';
      default: return '#6366f1';
    }
  }

  getSizeIcon(size) {
    switch (size) {
      case 'Small': return '🏢';
      case 'Medium': return '🏭';
      case 'Big': return '🏗️';
      default: return '🏢';
    }
  }

  render() {
    return (
      <div className="app-container">
        {!this.state.name &&
          <div className="welcome-section">
            <div className="welcome-card">
              <div className="icon-container">
                <span className="icon">👋</span>
              </div>
              <h2 className="welcome-title">Witaj w Portalu Studenckiego Projektu</h2>
              <p className="welcome-subtitle">Wprowadź swoje imię, aby uzyskać dostęp do bazy danych</p>

              <div className="input-group">
                <input
                  type="text"
                  id="name"
                  data-testid="name"
                  className="name-input"
                  placeholder="Wprowadź swoje imię..."
                />
                <button
                  className="submit-btn"
                  data-testid="submit-btn"
                  onClick={this.getCustomers.bind(this)}
                  disabled={this.state.loading}
                >
                  {this.state.loading ? (
                    <>
                      <span className="spinner"></span>
                      Ładowanie...
                    </>
                  ) : (
                    <>
                      <span>Kontynuuj</span>
                      <span className="arrow">→</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        }
        {this.state.name &&
          <div className="dashboard">
            <div className="dashboard-header">
              <div className="user-greeting">
                <h1>Witaj ponownie, <span className="highlight">{this.state.name}</span>!</h1>
                <p className="timestamp">📅 {this.state.timestamp}</p>
              </div>
              <div className="stats-card">
                <div className="stat">
                  <span className="stat-value">{this.state.customers?.length || 0}</span>
                  <span className="stat-label">Łączna liczba klientów</span>
                </div>
              </div>
            </div>

            {!this.state.customer &&
              <div className="customers-section">
                <div className="section-header">
                  <h2>Baza Danych Klientów</h2>
                  <p>Kliknij dowolnego klienta, aby wyświetlić szczegóły</p>
                </div>

                <div className="customers-grid">
                  {this.state.customers.map(customer =>
                    <div
                      key={customer.id}
                      className="customer-card"
                      onClick={() => this.getCustomer(customer)}
                    >
                      <div className="card-header">
                        <h3 className="company-name">{customer.name}</h3>
                        <span
                          className="size-badge"
                          style={{ backgroundColor: this.getSizeColor(customer.size) }}
                        >
                          {this.getSizeIcon(customer.size)} {customer.size}
                        </span>
                      </div>
                      <div className="card-body">
                        <div className="info-row">
                          <span className="info-label">👥 Pracownicy</span>
                          <span className="info-value">{customer.employees.toLocaleString()}</span>
                        </div>
                        {customer.contactInfo && (
                          <div className="contact-preview">
                            <span className="contact-icon">📧</span>
                            <span className="contact-text">{customer.contactInfo.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="card-footer">
                        <span className="view-details">Zobacz szczegóły →</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
            {this.state.customer &&
              <div className="customer-details">
                <button
                  className="back-btn"
                  onClick={() => this.setState({ customer: null })}
                >
                  ← Powrót do listy
                </button>

                <div className="details-card">
                  <div className="details-header">
                    <div>
                      <h2>{this.state.customer.name}</h2>
                      <span
                        className="size-badge-large"
                        style={{ backgroundColor: this.getSizeColor(this.state.customer.size) }}
                      >
                        {this.getSizeIcon(this.state.customer.size)} {this.state.customer.size === 'Small' ? 'Mała' : this.state.customer.size === 'Medium' ? 'Średnia' : 'Duża'} Firma
                      </span>
                    </div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <div className="detail-icon">👥</div>
                      <div className="detail-content">
                        <span className="detail-label">Łączna liczba pracowników</span>
                        <span className="detail-value">{this.state.customer.employees.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="detail-item">
                      <div className="detail-icon">📊</div>
                      <div className="detail-content">
                        <span className="detail-label">Rozmiar firmy</span>
                        <span className="detail-value">{this.state.customer.size === 'Small' ? 'Mała' : this.state.customer.size === 'Medium' ? 'Średnia' : 'Duża'}</span>
                      </div>
                    </div>

                    {this.state.customer.contactInfo && (
                      <>
                        <div className="detail-item">
                          <div className="detail-icon">👤</div>
                          <div className="detail-content">
                            <span className="detail-label">Osoba kontaktowa</span>
                            <span className="detail-value">{this.state.customer.contactInfo.name}</span>
                          </div>
                        </div>

                        <div className="detail-item">
                          <div className="detail-icon">📧</div>
                          <div className="detail-content">
                            <span className="detail-label">Adres email</span>
                            <span className="detail-value">{this.state.customer.contactInfo.email}</span>
                          </div>
                        </div>
                      </>
                    )}

                    {!this.state.customer.contactInfo && (
                      <div className="detail-item no-contact">
                        <div className="detail-icon">⚠️</div>
                        <div className="detail-content">
                          <span className="detail-label">Informacje kontaktowe</span>
                          <span className="detail-value">Niedostępne</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    )
  }
}

function App() {
  return (
    <div className="App">
      <CustomerApp />
    </div>
  );
}

export default App;
