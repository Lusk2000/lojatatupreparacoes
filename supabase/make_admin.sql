-- Rode DEPOIS de criar sua conta no site e confirmar o e-mail.
-- Troque o endereco abaixo pelo e-mail da conta que sera administradora.
insert into public.staff_roles (user_id, role)
select id, 'admin' from auth.users where email = 'SEU-EMAIL-AQUI'
on conflict (user_id) do update set role = 'admin';
