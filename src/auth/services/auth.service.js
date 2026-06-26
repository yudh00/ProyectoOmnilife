// =====================================================================
// SERVICE: auth.service.js
// Capa de lógica de negocio para la autenticación y control de accesos.
//
// SOLID/DIP: Recibe el repositorio por inyección en el factory method.
// SOLID/SRP: Delega las validaciones de formato a auth.validator.js.
// =====================================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Para seguridad y encriptación de contraseñas
const AppError = require('../../utils/AppError');
const validator = require('../validators/auth.validator');

// Clave secreta (en producción debe ir en variables de entorno .env)
const JWT_SECRET = process.env.JWT_SECRET || 'omnilife_super_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Convierte la fila plana de PostgreSQL al formato DTO CamelCase 
 * que espera tu interfaz AuthUser en TypeScript en el Frontend.
 */
function mapearUsuarioAutenticado(usuario, token) {
  return {
    idUsuario:         usuario.idusuario,
    correoElectronico: usuario.correoelectronico,
    nombreUsuario:     usuario.nombreusuario,
    apellidosUsuario:  usuario.apellidosusuario,
    idRol:             usuario.idrol,
    nombreRol:         usuario.nombrerol,
    token:             token
  };
}

// FACTORY DE SERVICIO — Dependency Inversion Principle (DIP)
/**
 * Crea una instancia del servicio de autenticación con el repositorio inyectado.
 * @param {typeof import('../repositories/auth.repository')} repo
 */
function crearServicioAuth(repo) {

  /**
   * Valida credenciales, comprueba contraseñas usando bcrypt y genera el JWT.
   * @param {string} correo
   * @param {string} contrasena
   */
  async function autenticarUsuario(correo, contrasena) {
    // 1. SRP: Validar formato usando las reglas aisladas del validador
    validator.validarLogin({ email: correo, password: contrasena });

    // 2. Buscar existencia del usuario en la base de datos
    const usuario = await repo.buscarUsuarioPorCorreo(correo.trim().toLowerCase());
    if (!usuario) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    // 3. Validación de la Contraseña utilizando Bcrypt (Seguro y profesional)
    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordMatch) {
      throw AppError.unauthorized('Credenciales incorrectas');
    }

    // 4. Construcción del Payload para el JWT (Información útil para los Middlewares)
    const payload = {
      idUsuario: usuario.idusuario,
      idRol:     usuario.idrol,
      nombreRol: usuario.nombrerol
    };

    // 5. Firma y emisión del Token de sesión
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 6. Patrón DTO / Mapper: Retornar los datos limpios al controlador
    return mapearUsuarioAutenticado(usuario, token);
  }

  /**
   * Lógica de negocio para registrar un nuevo Cliente con contraseña encriptada.
   * @param {Object} datosCliente
   * @param {string} datosCliente.nombre
   * @param {string} datosCliente.apellidos
   * @param {string} datosCliente.email
   * @param {string} datosCliente.password
   */
  async function registerClient({ nombre, apellidos, email, password }) {
    // 1. SRP: Validar formato usando las reglas aisladas de tu validador
    validator.validarRegistro({ nombre, apellidos, email, password });

    const emailFormateado = email.trim().toLowerCase();

    // 2. Control de reglas de negocio: Evitar duplicados
    const usuarioExistente = await repo.buscarUsuarioPorCorreo(emailFormateado);
    if (usuarioExistente) {
      throw AppError.conflict('El correo electrónico ya se encuentra registrado');
    }

    // 3. Hashear la contraseña usando un Salt robusto (10 rondas)
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // 4. Persistir en la base de datos delegando en el repositorio
    const nuevoUsuario = await repo.crearUsuarioCliente({
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      email: emailFormateado,
      contrasenaHash
    });

    // 5. UX: Emitir un token de una vez para que quede logueado tras registrarse
    const payload = {
      idUsuario: nuevoUsuario.idusuario,
      idRol:     nuevoUsuario.idrol,
      nombreRol: nuevoUsuario.nombrerol
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // 6. Retornar DTO mapeado listo para el consumo del Frontend
    return mapearUsuarioAutenticado(nuevoUsuario, token);
  }

  return {
    autenticarUsuario,
    registerClient,
  };
}

// EXPORTS ACCORDING TO YOUR STACK CONVENTION

// Instancia de producción (inyecta el repositorio PostgreSQL real)
const repo = require('../repositories/auth.repository');
module.exports = crearServicioAuth(repo);

// Exportación explícita para testing unitario / Mocks
module.exports.crearServicioAuth = crearServicioAuth;