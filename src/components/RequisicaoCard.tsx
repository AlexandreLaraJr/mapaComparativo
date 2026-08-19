import type { RequisicaoItem, Fornecedor } from "../types/requisicao";
import {
    calcularValorFinalAutomatico,
    formatarMoeda,
} from "../lib/calculosFornecedor";

interface RequisicaoCardProps {
    item: RequisicaoItem;
    onChange: (item: RequisicaoItem) => void;
    onRemover: () => void;
    podeRemover: boolean;
    onAdicionarFornecedor: () => void;
    onRemoverFornecedor: (indice: number) => void;
    onAtualizarFornecedor: <K extends keyof Fornecedor>(
        itemId: string,
        indice: number,
        campo: K,
        valor: Fornecedor[K],
    ) => void;
}

export default function RequisicaoCard({
    item,
    onChange,
    onRemover,
    podeRemover,
    onAdicionarFornecedor,
    onRemoverFornecedor,
    onAtualizarFornecedor,
}: RequisicaoCardProps) {
    const ehMaterial = item.tipo === "material";

    function atualizarCampo<K extends keyof RequisicaoItem>(
        campo: K,
        valor: RequisicaoItem[K],
    ) {
        onChange({ ...item, [campo]: valor });
    }

    function handleMudarTipo(novoTipo: RequisicaoItem["tipo"]) {
        onChange({
            ...item,
            tipo: novoTipo,
            numeroMaterial: novoTipo === "servico" ? "" : item.numeroMaterial,
        });
    }

    return (
        <div className="relative flex h-full w-full flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            {podeRemover && (
                <button
                    type="button"
                    onClick={onRemover}
                    aria-label="Remover item"
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                    ×
                </button>
            )}

            <div className="flex flex-wrap gap-4">
                <div className="w-40">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Item
                    </label>
                    <input
                        type="text"
                        value={item.numeroRC}
                        onChange={(e) =>
                            atualizarCampo("numeroRC", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Ex: 4500012345"
                    />
                </div>

                <div className="w-40">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Número de material
                    </label>
                    {ehMaterial ? (
                        <input
                            type="text"
                            value={item.numeroMaterial}
                            onChange={(e) =>
                                atualizarCampo("numeroMaterial", e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Ex: 100000123"
                        />
                    ) : (
                        <input
                            type="text"
                            value="Serviço"
                            disabled
                            readOnly
                            className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                        />
                    )}
                </div>
                <div className="w-20">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Quantidade
                    </label>
                    <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) =>
                            atualizarCampo("quantidade", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="0"
                    />
                </div>
                <div className="w-42">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Tipo
                    </label>
                    <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input
                                type="radio"
                                name={`tipo-${item.id}`}
                                checked={ehMaterial}
                                onChange={() => handleMudarTipo("material")}
                            />
                            Material
                        </label>
                        <label className="flex items-center gap-1.5 text-sm text-gray-700">
                            <input
                                type="radio"
                                name={`tipo-${item.id}`}
                                checked={!ehMaterial}
                                onChange={() => handleMudarTipo("servico")}
                            />
                            Serviço
                        </label>
                    </div>
                </div>

                <div className="w-6/10">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Texto breve
                    </label>
                    <input
                        type="text"
                        value={item.textoBreve}
                        onChange={(e) =>
                            atualizarCampo("textoBreve", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Descrição resumida do item"
                    />
                </div>
                <div className="w-60">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Preço de avaliação
                    </label>
                    <input
                        type="number"
                        value={item.precoAvaliacao}
                        onChange={(e) =>
                            atualizarCampo("precoAvaliacao", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="R$ 0,00"
                    />
                </div>
            </div>

            {/* ---- Fornecedores ---- */}
            <div className="mt-5 flex min-h-0 flex-1 flex-col border-t border-gray-100 pt-4">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">
                        Fornecedores{" "}
                        <span className="font-normal text-gray-400">
                            (mín. 1)
                        </span>
                    </h3>
                    <button
                        type="button"
                        onClick={onAdicionarFornecedor}
                        className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        + Fornecedor
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">
                    {item.fornecedores.map((fornecedor, indice) => (
                        <div
                            key={fornecedor.id}
                            className="relative rounded-md border border-gray-100 bg-gray-50 p-3"
                        >
                            {item.fornecedores.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onRemoverFornecedor(indice)}
                                    aria-label="Remover fornecedor"
                                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                                >
                                    ×
                                </button>
                            )}
                            <div className="mb-2 text-xs font-medium text-gray-500">
                                Fornecedor {indice + 1}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <CampoFornecedor
                                    label="Nome"
                                    value={fornecedor.nome}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "nome",
                                            v,
                                        )
                                    }
                                    className="w-72"
                                />
                                <CampoFornecedor
                                    label="Proposta"
                                    value={fornecedor.proposta}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "proposta",
                                            v,
                                        )
                                    }
                                    className="w-30"
                                />
                                <CampoFornecedor
                                    label="ICMS (%)"
                                    value={fornecedor.icms}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "icms",
                                            v,
                                        )
                                    }
                                    type="number"
                                    className="w-15"
                                />
                                <CampoFornecedor
                                    label="PIS/COFINS (%)"
                                    value={fornecedor.pisCofins}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "pisCofins",
                                            v,
                                        )
                                    }
                                    type="number"
                                    className="w-24"
                                />
                                <CampoFornecedor
                                    label="IPI (%)"
                                    value={fornecedor.ipi}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "ipi",
                                            v,
                                        )
                                    }
                                    type="number"
                                    className="w-15"
                                />
                                <CampoFornecedor
                                    label="Desconto (%)"
                                    value={fornecedor.desconto}
                                    onChange={(v) =>
                                        onAtualizarFornecedor(
                                            item.id,
                                            indice,
                                            "desconto",
                                            v,
                                        )
                                    }
                                    type="number"
                                    className="w-[calc(50%-0.25rem)] sm:w-[calc(33.333%-0.34rem)]"
                                />
                                <div className="w-[calc(50%-0.25rem)] sm:w-[calc(33.333%-0.34rem)]">
                                    <CampoFornecedor
                                        label="Valor do item"
                                        value={fornecedor.valorItem}
                                        onChange={(v) =>
                                            onAtualizarFornecedor(
                                                item.id,
                                                indice,
                                                "valorItem",
                                                v,
                                            )
                                        }
                                        type="number"
                                    />
                                    <span className="mt-1 block text-[11px] text-gray-400">
                                        Sugestão:{" "}
                                        {formatarMoeda(
                                            calcularValorFinalAutomatico(
                                                item,
                                                fornecedor,
                                            ),
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CampoFornecedor({
    label,
    value,
    onChange,
    type = "text",
    className = "",
}: {
    label: string;
    value: string;
    onChange: (valor: string) => void;
    type?: string;
    className?: string;
}) {
    return (
        <label className={`block text-xs text-gray-600 ${className}`}>
            {label}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
        </label>
    );
}
