import { FormularioLogin } from "./FormularioLogin";
import { Marca } from "@/componentes/Marca";

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Marca />
        </div>
        <FormularioLogin />
      </div>
    </div>
  );
}
