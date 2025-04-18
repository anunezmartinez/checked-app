# Install Angular CLI if not already installed
npm install -g @angular/cli

# Create a new Angular project
ng new checked-app --routing --style=scss

# Navigate to the project directory
cd checked-app

# Install required dependencies
npm install @angular/material @angular/cdk
npm install @angular/flex-layout
npm install ngx-toastr
npm install @auth0/angular-jwt

# Generate core components and services
ng generate module core
ng generate module shared
ng generate module auth --routing
ng generate module checks --routing

# Auth components
ng generate component auth/login
ng generate component auth/register
ng generate service auth/auth

# Check components
ng generate component checks/check-list
ng generate component checks/check-create
ng generate component checks/check-detail
ng generate service checks/check

# Core components
ng generate component core/header
ng generate component core/footer
ng generate service core/notification
