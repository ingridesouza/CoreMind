up:        ## sobe tudo
	docker compose up --build
down:      ## derruba
	docker compose down
shell:     ## entra no backend
	docker compose exec backend bash
createsuperuser:
	docker compose exec backend python manage.py createsuperuser
migrate:
	docker compose exec backend python manage.py migrate
