import { useMemo, useState } from "react";
import type { RequisicaoItem } from "../types/requisicao";
import { interpretarColagem } from "../lib/interpretarColagem";

interface ModalColarDadosProps {
  quantidadeFornecedores: number;
  onImportar: (itens: RequisicaoItem[], substituir: boolean) => void;
  onCancelar: () => void;
}

export default function ModalColarDados({ quantidadeFornecedores, onImportar, onCancelar }: ModalColarDadosProps) {
  const [texto, setTexto] = useState("");
  const [substituir, setSubstituir] = useState(true);

  // Pré-visualização em tempo real do que será importado
  const resultado = useMemo(() => interpretarColagem(texto, quantidadeFornecedores), [texto, quantidadeFornecedores]);

  function handleImportar() {
    if (resultado.itens.length === 0) return;
    onImportar(resultado.itens, substituir);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Colar dados da requisição</h2>
        <p className="mb-4 text-sm text-gray-500">
          Copie os dados do sistema e cole abaixo. Os campos devem estar nesta ordem, um por linha: número do material,
          texto breve, quantidade, unidade de medida, preço de avaliação.
        </p>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={10}
          autoFocus
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          placeholder={"100000123\nParafuso sextavado\n10\nUN\n15,50\n100000124\nPorca\n20\nUN\n2,30"}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm">
            {resultado.itens.length > 0 ? (
              <span className="text-green-700">
                {resultado.itens.length} {resultado.itens.length === 1 ? "item detectado" : "itens detectados"}
              </span>
            ) : (
              texto.trim().length > 0 && <span className="text-amber-600">Nenhum item completo detectado ainda.</span>
            )}
            {resultado.linhasIgnoradas > 0 && (
              <span className="ml-2 text-amber-600">
                ({resultado.linhasIgnoradas} {resultado.linhasIgnoradas === 1 ? "linha incompleta será ignorada" : "linhas incompletas serão ignoradas"})
              </span>
            )}
          </div>
        </div>

        {resultado.itens.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-md border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Nº Material</th>
                  <th className="px-3 py-2">Texto breve</th>
                  <th className="px-3 py-2">Qtd.</th>
                  <th className="px-3 py-2">UM</th>
                  <th className="px-3 py-2">Preço aval.</th>
                </tr>
              </thead>
              <tbody>
                {resultado.itens.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-400">{item.ordem}</td>
                    <td className="px-3 py-2 text-gray-800">{item.numeroMaterial}</td>
                    <td className="px-3 py-2 text-gray-800">{item.textoBreve}</td>
                    <td className="px-3 py-2 text-gray-600">{item.quantidade}</td>
                    <td className="px-3 py-2 text-gray-600">{item.unidadeMedida}</td>
                    <td className="px-3 py-2 text-gray-600">{item.precoAvaliacao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={substituir} onChange={(e) => setSubstituir(e.target.checked)} />
          Substituir os itens atuais (desmarque para adicionar ao final da lista)
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleImportar}
            disabled={resultado.itens.length === 0}
            className="rounded-md bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importar {resultado.itens.length > 0 ? `${resultado.itens.length} ${resultado.itens.length === 1 ? "item" : "itens"}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
