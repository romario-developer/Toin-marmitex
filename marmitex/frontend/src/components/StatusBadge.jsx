export default function StatusBadge({ type, value }) {
  let text = String(value || '').replace('_', ' ');
  let className = 'px-2 py-1 text-xs rounded-full select-none';

  if (type === 'pagamento') {
    if (value === 'pago') className += ' bg-green-100 text-green-800';
    else if (value === 'pendente') className += ' bg-yellow-100 text-yellow-800';
    else className += ' bg-gray-100 text-gray-700';
  } else {
    if (value === 'finalizado') className += ' bg-blue-100 text-blue-800';
    else className += ' bg-purple-100 text-purple-800';
  }
  return <span className={className}>{text}</span>;
}
