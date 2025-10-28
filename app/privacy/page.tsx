import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad - AMAWA',
  description: 'Política de Privacidad y Protección de Datos de AMAWA',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Política de Privacidad
        </h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <p className="text-sm text-gray-500 mb-4">
              Última actualización: {new Date().toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              1. Información General
            </h2>
            <p className="mb-3">
              AMAWA ("nosotros", "nuestro" o "la empresa") se compromete a proteger su privacidad.
              Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y protegemos
              su información cuando utiliza nuestros servicios de purificación de agua y nuestra
              plataforma de gestión de clientes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              2. Información que Recopilamos
            </h2>
            <p className="mb-2">Recopilamos la siguiente información:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Información de Contacto:</strong> Nombre, dirección, número de teléfono,
                correo electrónico
              </li>
              <li>
                <strong>Información del Servicio:</strong> Tipo de equipo instalado, fechas de
                mantenimiento, historial de servicios
              </li>
              <li>
                <strong>Información de Comunicación:</strong> Mensajes enviados y recibidos a través
                de WhatsApp Business API y otros canales
              </li>
              <li>
                <strong>Información Técnica:</strong> Dirección IP, tipo de navegador, sistema operativo
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              3. Cómo Usamos su Información
            </h2>
            <p className="mb-2">Utilizamos su información para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y mantener nuestros servicios de purificación de agua</li>
              <li>Programar y recordar citas de mantenimiento</li>
              <li>Enviar notificaciones sobre entregas de filtros y servicios técnicos</li>
              <li>Responder a sus consultas y proporcionar soporte al cliente</li>
              <li>Mejorar nuestros servicios y experiencia del cliente</li>
              <li>Cumplir con obligaciones legales y regulatorias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              4. Comunicaciones por WhatsApp
            </h2>
            <p className="mb-3">
              Utilizamos WhatsApp Business API para comunicarnos con nuestros clientes. Al proporcionar
              su número de WhatsApp, usted acepta recibir mensajes relacionados con:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Confirmaciones de citas y cambios de programación</li>
              <li>Recordatorios de mantenimiento preventivo</li>
              <li>Notificaciones de entrega de filtros</li>
              <li>Tutoriales de instalación y mantenimiento</li>
              <li>Actualizaciones sobre el estado de su servicio</li>
            </ul>
            <p className="mt-3">
              Puede optar por no recibir estos mensajes en cualquier momento respondiendo
              "STOP" o contactándonos directamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              5. Compartir Información
            </h2>
            <p className="mb-3">
              No vendemos ni alquilamos su información personal a terceros. Podemos compartir
              su información con:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Proveedores de Servicios:</strong> Empresas que nos ayudan a operar nuestro
                negocio (hosting, servicios de mensajería, procesamiento de pagos)
              </li>
              <li>
                <strong>Técnicos:</strong> Personal autorizado que realiza servicios en su domicilio
              </li>
              <li>
                <strong>Cumplimiento Legal:</strong> Cuando sea requerido por ley o para proteger
                nuestros derechos
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              6. Seguridad de los Datos
            </h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger
              su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
              Utilizamos cifrado SSL/TLS para proteger los datos en tránsito y almacenamos la información
              en servidores seguros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              7. Retención de Datos
            </h2>
            <p>
              Conservamos su información personal durante el tiempo que sea necesario para cumplir
              con los propósitos descritos en esta política, a menos que la ley requiera o permita
              un período de retención más largo. Los registros de mantenimiento y servicio se
              mantienen durante la vida útil del equipo instalado.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              8. Sus Derechos
            </h2>
            <p className="mb-2">Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acceder a su información personal que mantenemos</li>
              <li>Solicitar la corrección de información inexacta</li>
              <li>Solicitar la eliminación de su información personal</li>
              <li>Oponerse al procesamiento de su información personal</li>
              <li>Solicitar la portabilidad de sus datos</li>
              <li>Retirar su consentimiento en cualquier momento</li>
            </ul>
            <p className="mt-3">
              Para ejercer estos derechos, por favor contáctenos usando la información proporcionada abajo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              9. Cookies y Tecnologías Similares
            </h2>
            <p>
              Nuestro sitio web puede utilizar cookies y tecnologías similares para mejorar su
              experiencia de usuario. Puede configurar su navegador para rechazar cookies, aunque
              esto puede afectar algunas funcionalidades del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              10. Cambios a esta Política
            </h2>
            <p>
              Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre
              cambios significativos publicando la nueva política en esta página y actualizando la
              fecha de "Última actualización".
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              11. Legislación Aplicable
            </h2>
            <p>
              Esta Política de Privacidad se rige por las leyes de Chile, incluyendo la Ley N° 19.628
              sobre Protección de la Vida Privada y el cumplimiento de las regulaciones aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              12. Contacto
            </h2>
            <p className="mb-3">
              Si tiene preguntas sobre esta Política de Privacidad o desea ejercer sus derechos,
              por favor contáctenos:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">AMAWA - Purificación de Agua</p>
              <p>WhatsApp: +56 9 7655 9269</p>
              <p>Email: contacto@amawa.cl</p>
              <p>Dirección: Santiago, Chile</p>
            </div>
          </section>

          <section className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 italic">
              Al utilizar nuestros servicios, usted acepta esta Política de Privacidad y el
              procesamiento de su información personal como se describe aquí.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
