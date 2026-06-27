// =====================================================================
// PRUEBAS UNITARIAS: financiero.service.js
// Usa el patrón factory para inyectar el repo mock (DIP).
// =====================================================================

const { crearServicioFinanciero } = require('../src/financiero/services/financiero.service');

let repoMock;
let svc;

beforeEach(() => {
  repoMock = {
    obtenerIngresosPeriodo: jest.fn(),
    obtenerGastosPeriodo: jest.fn(),
    obtenerFlujoCajaNeto: jest.fn(),
    obtenerEstadisticasPeriodo: jest.fn(),
    obtenerRentabilidadPorPeriodo: jest.fn(),
    calcularRentabilidadProducto: jest.fn(),
  };
  svc = crearServicioFinanciero(repoMock);
});

// =====================================================================
// Validación de fechas (compartida por todos los métodos de periodo)
// =====================================================================

describe('validación de fechas (compartida)', () => {
  test('lanza AppError 400 si falta fechaInicio o fechaFin', async () => {
    await expect(svc.obtenerIngresosPeriodo(null, '2026-06-30')).rejects.toMatchObject({ status: 400 });
    await expect(svc.obtenerIngresosPeriodo('2026-01-01', null)).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 400 si las fechas no son válidas', async () => {
    await expect(svc.obtenerIngresosPeriodo('no-es-fecha', '2026-06-30')).rejects.toMatchObject({ status: 400 });
    await expect(svc.obtenerIngresosPeriodo('2026-01-01', 'tampoco')).rejects.toMatchObject({ status: 400 });
  });

  test('lanza AppError 400 si fechaInicio es posterior a fechaFin', async () => {
    await expect(svc.obtenerIngresosPeriodo('2026-12-01', '2026-01-01')).rejects.toMatchObject({ status: 400 });
  });
});

// =====================================================================
// obtenerIngresosPeriodo
// =====================================================================

describe('obtenerIngresosPeriodo', () => {
  test('retorna valores en cero si el repo devuelve null', async () => {
    repoMock.obtenerIngresosPeriodo.mockResolvedValue(null);
    const resultado = await svc.obtenerIngresosPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.TotalIngresos).toBe(0);
    expect(resultado.CantidadPedidosPagados).toBe(0);
  });

  test('retorna ingresos parseados cuando hay datos', async () => {
    repoMock.obtenerIngresosPeriodo.mockResolvedValue({
      totalingresos: '15000.50',
      cantidadpedidospagados: '12',
      fechainicio: '2026-01-01',
      fechafin: '2026-06-30',
    });
    const resultado = await svc.obtenerIngresosPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.totalIngresos).toBe(15000.50);
    expect(resultado.cantidadPedidosPagados).toBe(12);
  });
});

// =====================================================================
// obtenerGastosPeriodo
// =====================================================================

describe('obtenerGastosPeriodo', () => {
  test('retorna valores en cero si el repo devuelve null', async () => {
    repoMock.obtenerGastosPeriodo.mockResolvedValue(null);
    const resultado = await svc.obtenerGastosPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.totalGastos).toBe(0);
    expect(resultado.cantidadMovimientos).toBe(0);
  });

  test('retorna gastos parseados cuando hay datos', async () => {
    repoMock.obtenerGastosPeriodo.mockResolvedValue({
      totalgastos: '5000.00',
      cantidadmovimientos: '7',
      detallegastos: 'Compra de producto X',
    });
    const resultado = await svc.obtenerGastosPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.totalGastos).toBe(5000);
    expect(resultado.cantidadMovimientos).toBe(7);
    expect(resultado.detalleGastos).toBe('Compra de producto X');
  });
});

// =====================================================================
// obtenerFlujoCajaNeto
// =====================================================================

describe('obtenerFlujoCajaNeto', () => {
  test('retorna ceros si el repo devuelve null', async () => {
    repoMock.obtenerFlujoCajaNeto.mockResolvedValue(null);
    const resultado = await svc.obtenerFlujoCajaNeto('2026-01-01', '2026-06-30');
    expect(resultado.flujoCajaNeto).toBe(0);
    expect(resultado.totalIngresos).toBe(0);
    expect(resultado.totalEgresos).toBe(0);
  });

  test('calcula flujo neto correctamente', async () => {
    repoMock.obtenerFlujoCajaNeto.mockResolvedValue({
      totalingresos: '10000',
      totalegresos: '3000',
      flujocajaneto: '7000',
      cantidadingresos: '20',
      cantidadegresos: '5',
    });
    const resultado = await svc.obtenerFlujoCajaNeto('2026-01-01', '2026-06-30');
    expect(resultado.flujoCajaNeto).toBe(7000);
    expect(resultado.cantidadIngresos).toBe(20);
  });
});

// =====================================================================
// obtenerEstadisticasPeriodo
// =====================================================================

describe('obtenerEstadisticasPeriodo', () => {
  test('retorna null si el repo devuelve null', async () => {
    repoMock.obtenerEstadisticasPeriodo.mockResolvedValue(null);
    const resultado = await svc.obtenerEstadisticasPeriodo('2026-01-01', '2026-06-30');
    expect(resultado).toBeNull();
  });

  test('retorna estadísticas parseadas correctamente', async () => {
    repoMock.obtenerEstadisticasPeriodo.mockResolvedValue({
      totalingresos: '20000',
      totalegresos: '5000',
      flujocajaneto: '15000',
      ticketpromedio: '1250',
      pedidoscompletados: '16',
      pedidoscancelados: '2',
      gastopromedioporpedido: '312.5',
      rentabilidadpromedioproductos: '35.5',
      margenpromedioporcentual: '28',
      diasmedidos: '180',
    });
    const resultado = await svc.obtenerEstadisticasPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.ticketPromedio).toBe(1250);
    expect(resultado.pedidosCompletados).toBe(16);
    expect(resultado.margenPromedioPorcentual).toBe(28);
    expect(resultado.diasMedidos).toBe(180);
  });
});

// =====================================================================
// obtenerRentabilidadPorPeriodo
// =====================================================================

describe('obtenerRentabilidadPorPeriodo', () => {
  test('retorna ceros si el repo devuelve null', async () => {
    repoMock.obtenerRentabilidadPorPeriodo.mockResolvedValue(null);
    const resultado = await svc.obtenerRentabilidadPorPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.rentabilidadNeta).toBe(0);
  });

  test('retorna rentabilidad parseada', async () => {
    repoMock.obtenerRentabilidadPorPeriodo.mockResolvedValue({
      totalingresos: '20000',
      totalegresos: '5000',
      rentabilidadneta: '15000',
    });
    const resultado = await svc.obtenerRentabilidadPorPeriodo('2026-01-01', '2026-06-30');
    expect(resultado.rentabilidadNeta).toBe(15000);
    expect(resultado.totalIngresos).toBe(20000);
  });
});

// =====================================================================
// calcularRentabilidadProducto
// =====================================================================

describe('calcularRentabilidadProducto', () => {
  test('lanza AppError 400 si el ID no es válido', async () => {
    await expect(svc.calcularRentabilidadProducto('abc')).rejects.toMatchObject({ status: 400 });
    await expect(svc.calcularRentabilidadProducto(0)).rejects.toMatchObject({ status: 400 });
  });

  test('lanza error 404 si el producto no existe', async () => {
    repoMock.calcularRentabilidadProducto.mockResolvedValue(null);
    const err = await svc.calcularRentabilidadProducto(99).catch((e) => e);
    expect(err.status).toBe(404);
  });

  test('retorna la rentabilidad del producto parseada', async () => {
    repoMock.calcularRentabilidadProducto.mockResolvedValue({
      idproducto: 1,
      nombreproducto: 'Omega 3',
      precioventaproducto: '25.00',
      costoadquisicion: '15.00',
      rentabilidadunitaria: '10.00',
      margenporcentual: '40.00',
    });
    const resultado = await svc.calcularRentabilidadProducto(1);
    expect(resultado.precioVenta).toBe(25);
    expect(resultado.rentabilidadUnitaria).toBe(10);
    expect(resultado.margenPorcentual).toBe(40);
    expect(resultado.nombreProducto).toBe('Omega 3');
  });
});
