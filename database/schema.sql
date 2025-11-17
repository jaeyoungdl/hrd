-- public.projects definition

-- Drop table

-- DROP TABLE public.projects;

CREATE TABLE public.projects (
	id SERIAL PRIMARY KEY,
	"name" varchar(255) NOT NULL,
	description text NULL,
	start_month varchar(7) NOT NULL,
	end_month varchar(7) NOT NULL,
	pm_id int4 NULL,
	pm_name varchar(100) NULL,
	frontend int4[] DEFAULT '{}'::int4[] NULL,
	backend int4[] DEFAULT '{}'::int4[] NULL,
	designer int4[] DEFAULT '{}'::int4[] NULL,
	ux int4[] DEFAULT '{}'::int4[] NULL,
	app int4[] DEFAULT '{}'::int4[] NULL,
	ai int4[] DEFAULT '{}'::int4[] NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL
);


-- public.projects foreign keys

ALTER TABLE public.projects ADD CONSTRAINT projects_pm_id_fkey FOREIGN KEY (pm_id) REFERENCES public.users(id);

-- public.tasks definition

-- Drop table

-- DROP TABLE public.tasks;

CREATE TABLE public.tasks (
	id SERIAL PRIMARY KEY,
	project_id int4 NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	"month" varchar(7) NOT NULL,
	category varchar(50) NOT NULL,
	part varchar(50) NOT NULL,
	assignee_id int4 NULL,
	assignee_name varchar(100) NULL,
	status varchar(20) DEFAULT '대기'::character varying NOT NULL,
	start_date date NULL,
	end_date date NULL,
	pm_confirmed bool DEFAULT false NULL,
	pm_confirmed_date date NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL
);
CREATE INDEX idx_tasks_assignee_id ON public.tasks USING btree (assignee_id);
CREATE INDEX idx_tasks_month ON public.tasks USING btree (month);
CREATE INDEX idx_tasks_project_id ON public.tasks USING btree (project_id);
CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


-- public.tasks foreign keys

ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);
ALTER TABLE public.tasks ADD CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);

-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id SERIAL PRIMARY KEY,
	email varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"position" varchar(50) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT users_email_key UNIQUE (email)
);
CREATE INDEX idx_users_email ON public.users USING btree (email);
