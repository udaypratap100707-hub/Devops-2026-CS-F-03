.PHONY: install dev test lint docker-build docker-run compose-up compose-down

install:      ; npm ci
dev:          ; npm run dev
test:         ; npm test
lint:         ; npm run lint
docker-build: ; docker build -t student-placement-system:latest .
docker-run:   ; docker run --rm -p 3000:3000 student-placement-system:latest
compose-up:   ; docker compose up -d --build
compose-down: ; docker compose down
