<!-- yss_orbit\docs\onboarding\developer-setup.md -->
# Developer Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 15
- Redis 7

## Quick Start
  docker-compose up -d postgres redis
  cd backend
  pip install -r requirements/local.txt
  python manage.py migrate
  python manage.py seed_all
  python manage.py runserver
  cd ../frontend && npm install && npm run dev
