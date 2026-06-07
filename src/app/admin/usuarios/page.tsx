import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAdminUsers } from "@/lib/data/admin";

const ROLE_META: Record<string, { label: string; variant: "muted" | "outline" | "success" }> = {
  ADMIN: { label: "Admin", variant: "success" },
  BUSINESS: { label: "Empresa", variant: "outline" },
  USER: { label: "Usuario", variant: "muted" },
};

export default async function AdminUsuariosPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Cuentas registradas en Destaco, con su correo y empresas.
      </p>

      <div className="mt-6">
        {users.length === 0 ? (
          <EmptyState
            title="No hay usuarios que mostrar"
            description="Conecta PostgreSQL para ver las cuentas registradas."
          />
        ) : (
          <div className="bg-card overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground border-b text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Rol</th>
                  <th className="px-4 py-3 text-right font-medium">Empresas</th>
                  <th className="px-4 py-3 text-right font-medium">Alta</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const meta = ROLE_META[user.role] ?? ROLE_META.USER;
                  return (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <a
                          href={`mailto:${user.email}`}
                          className="font-medium hover:underline"
                        >
                          {user.email}
                        </a>
                      </td>
                      <td className="text-muted-foreground px-4 py-3">
                        {user.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {user.companyCount}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                        {new Date(user.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
