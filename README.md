# System Zarządzania Klientami - Architektura Mikroserwisów

Konteneryzowana aplikacja mikroserwisowa demonstrująca nowoczesną architekturę chmurową z frontendem React, backendem Node.js, bazą danych PostgreSQL i brokerem wiadomości Apache Kafka.

## 🏗️ Przegląd Architektury

Ten projekt implementuje kompletną architekturę mikroserwisów z **5 kontenerami Docker** komunikującymi się przez wspólną sieć:

---

## 📦 Szybki Start

### 1. Sklonuj lub przejdź do katalogu projektu
```bash
cd Docker-Studia
```

### 2. Uruchom wszystkie serwisy
```bash
docker-compose up --build
```

Ta komenda wykona:
- Zbudowanie obrazów Docker dla frontendu i backendu
- Pobranie obrazów PostgreSQL, Kafka i Zookeeper
- Utworzenie sieci Docker do komunikacji między serwisami
- Inicjalizację bazy danych PostgreSQL danymi klientów
- Uruchomienie wszystkich 5 kontenerów z kontrolą zdrowia

### 5. Zatrzymanie serwisów

```bash
docker-compose down
```

## 🧪 Testowanie

### Ręczne testowanie przez przeglądarkę
1. Uruchom serwisy: `docker-compose up --build`
2. Otwórz http://localhost:3000
3. Wprowadź dowolną nazwę sprzedawcy
4. Sprawdź czy wyświetla się lista 6 klientów
5. Sprawdź czy rozmiary firm są poprawnie obliczone:
   - Mała: ≤ 100 pracowników
   - Średnia: 101-1000 pracowników
   - Duża: > 1000 pracowników

### Automatyczne testy E2E z Cypress
```bash
# Zainstaluj zależności (jeśli jeszcze nie zrobione)
npm install

# Uruchom testy Cypress
npm run cypress:run
```

### Weryfikacja wiadomości Kafka
```bash
# Lista topików Kafka
docker exec -it docker-studia-kafka kafka-topics \
  --list --bootstrap-server localhost:9092

# Odbieranie wiadomości z topiku customer-requests
docker exec -it docker-studia-kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic customer-requests \
  --from-beginning
```

### Weryfikacja danych w bazie
```bash
# Połączenie z PostgreSQL
docker exec -it docker-studia-postgres psql -U postgres -d customersdb

# Zapytanie o klientów
SELECT * FROM customers;

# Wyjście
\q
```

---

## 🐳 Ściągawka Komend Docker

```bash
# Uruchom serwisy w trybie odłączonym
docker-compose up -d

# Przeglądanie logów wszystkich serwisów
docker-compose logs -f

# Przeglądanie logów konkretnego serwisu
docker-compose logs -f backend

# Sprawdzenie statusu serwisów
docker-compose ps

# Restart konkretnego serwisu
docker-compose restart backend

# Przebudowanie konkretnego serwisu
docker-compose up -d --build backend

# Zatrzymanie wszystkich serwisów
docker-compose down

# Usunięcie wszystkich danych (włącznie z bazą danych)
docker-compose down -v

# Dostęp do powłoki działającego kontenera
docker exec -it docker-studia-backend sh
```

---

## 📁 Struktura Projektu

```
Docker-Studia/
├── backend/
│   ├── Dockerfile              # Instrukcje budowania kontenera backendu
│   ├── server.js               # API Express z PostgreSQL i Kafka
│   ├── package.json            # Zależności Node.js
│   └── init-db.sql             # Skrypt inicjalizacji PostgreSQL
├── frontend/
│   ├── Dockerfile              # Wieloetapowe budowanie frontendu
│   ├── nginx.conf              # Konfiguracja nginx
│   ├── package.json            # Zależności React
│   └── src/                    # Kod źródłowy React
├── cypress/                    # Testy E2E
├── docker-compose.yml          # Orkiestracja wielu kontenerów
├── .env.example                # Szablon zmiennych środowiskowych
└── README.md                   # Ten plik
```

## 📝 Licencja

Projekt akademicki na przedmiot aplikacje dla środowisk chmurowych.

---

## 🙏 Technologie

- **React** - Framework frontendowy
- **Express.js** - Framework backendowy
- **PostgreSQL** - Relacyjna baza danych
- **Apache Kafka** - Platforma strumieniowania rozproszonego
- **Docker** - Platforma konteneryzacji
- **nginx** - Serwer webowy dla produkcyjnego frontendu

---
