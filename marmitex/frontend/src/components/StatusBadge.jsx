export default function StatusBadge({ type, value }) {
  const getStatusClass = () => {
    if (type === 'pagamento') {
      switch (value) {
        case 'pago': return 'bg-green-100 text-green-800';
        case 'pendente': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      // Status do pedido
      switch (value) {
        case 'em_preparo': return 'bg-blue-100 text-blue-800';
        case 'pronto': return 'bg-orange-100 text-orange-800';
        case 'entregue': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const formatValue = (val) => {
    return val ? val.replace(/_/g, ' ') : '';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass()}`}>
      {formatValue(value)}
    </span>
  );
}
