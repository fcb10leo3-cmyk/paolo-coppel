import React, { useState } from 'react';

interface HardwareBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareBlueprintModal: React.FC<HardwareBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'screen' | 'button' | 'printer' | 'payment_hw' | 'budget'>('summary');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-400/40 w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#002B66] via-blue-900 to-slate-900 border-b border-amber-400/30 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-[#002B66] flex items-center justify-center font-extrabold text-xl shadow">
              <i className="fa-solid fa-microchip"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Guía de Hardware & Circuitos: Kiosco Coppel Asistencia
              </h2>
              <p className="text-xs text-amber-300 font-medium">
                Especificación técnica viable, económica y factible para producción real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-motion"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'summary'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-list-check mr-1.5"></i>
            Resumen General (BOM)
          </button>
          <button
            onClick={() => setActiveTab('screen')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'screen'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-tv mr-1.5"></i>
            Pantalla / Tablet
          </button>
          <button
            onClick={() => setActiveTab('button')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'button'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-circle-dot mr-1.5"></i>
            Botón "Push to Speak" & Circuito
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'printer'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-print mr-1.5"></i>
            Impresora & Audio
          </button>
          <button
            onClick={() => setActiveTab('payment_hw')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'payment_hw'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-credit-card mr-1.5"></i>
            PinPad & Pagos Seguros
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`py-3 px-3 font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'budget'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-calculator mr-1.5"></i>
            Presupuesto & 3 Alternativas
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 sm:p-6 overflow-y-auto text-xs sm:text-sm space-y-4 screen-scroll text-slate-300">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="bg-blue-950/60 p-4 rounded-2xl border border-blue-800/80">
                <h3 className="font-extrabold text-amber-300 text-sm mb-1 flex items-center">
                  <i className="fa-solid fa-lightbulb mr-2"></i>
                  Concepto y Factibilidad del Kiosco Coppel
                </h3>
                <p className="leading-relaxed">
                  Para que el tótem sea <strong>viable, duradero y de bajo costo</strong> en tiendas Coppel, no conviene comprar componentes industriales automotrices costosos. La solución óptima probada en retail consiste en una <strong>pantalla táctil comercial (15.6" a 21.5")</strong> conectada a una <strong>Mini PC económica (Intel N100)</strong> o <strong>Tablet Android industrial</strong>, con un botón arcade USB estándar que se conecta como teclado HID plug & play.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80">
                  <span className="font-bold text-amber-400 block mb-1">1. Pantalla Touch (15.6" a 21.5")</span>
                  <p className="text-slate-400">Panel táctil capacitivo multitouch (Full HD 1080p). Se puede usar una tablet comercial grande o un monitor táctil HDMI/USB.</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80">
                  <span className="font-bold text-amber-400 block mb-1">2. Botón Físico "Push to Speak"</span>
                  <p className="text-slate-400">Botón arcade tipo domo de 60mm con anillo LED azul 12V y microswitch. Se conecta a una placa USB Zero-Delay de $10 USD.</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80">
                  <span className="font-bold text-amber-400 block mb-1">3. Impresora Térmica Empotrada</span>
                  <p className="text-slate-400">Módulo OEM de 58mm o 80mm con cortador automático de papel y conexión USB/Serial ESC/POS estándar.</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80">
                  <span className="font-bold text-amber-400 block mb-1">4. Gabinete / Tótem Azul</span>
                  <p className="text-slate-400">Cuerpo en chapa de acero doblada en frío cal. 18 con pintura electrostática azul Coppel y letrero superior retroiluminado LED.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'screen' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base">¿Qué tipo de pantalla y cuántas pulgadas?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-amber-400/40 relative">
                  <div className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full inline-block mb-2">
                    RECOMENDACIÓN #1 (La más equilibrada)
                  </div>
                  <h4 className="font-bold text-white text-sm">Monitor Táctil 21.5" + Mini PC</h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 mt-2">
                    <li>• <strong>Tamaño:</strong> 21.5 pulgadas (Exacto a la foto de referencia).</li>
                    <li>• <strong>Tecnología:</strong> Táctil Capacitiva Proyectada (PCAP 10 puntos).</li>
                    <li>• <strong>Cerebro:</strong> Mini PC Intel N100 (16GB RAM, 256GB SSD) corriendo Windows o Linux Kiosk.</li>
                    <li>• <strong>Entradas:</strong> HDMI para video + USB para el touch.</li>
                    <li>• <strong>Costo estimado:</strong> $280 USD monitor + $130 USD Mini PC.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <div className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full inline-block mb-2">
                    OPCIÓN TABLET ANDROID (Económica)
                  </div>
                  <h4 className="font-bold text-white text-sm">Tablet Comercial 14.6" a 15.6"</h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 mt-2">
                    <li>• <strong>Modelos:</strong> Samsung Galaxy Tab S9 FE+ / Ultra, o Tablet Kiosk PoE 15.6".</li>
                    <li>• <strong>Ventaja:</strong> Incluye procesador, batería, altavoz y Wi-Fi en un solo equipo ultra delgado.</li>
                    <li>• <strong>Software Kiosco:</strong> Fully Kiosk Browser para bloquear la pantalla.</li>
                    <li>• <strong>Costo estimado:</strong> $350 - $490 USD.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                  <div className="text-[10px] font-bold bg-slate-600 text-slate-200 px-2 py-0.5 rounded-full inline-block mb-2">
                    OPCIÓN IPAD PRO (Premium)
                  </div>
                  <h4 className="font-bold text-white text-sm">iPad 10.9" o iPad Pro 12.9"</h4>
                  <ul className="text-xs text-slate-300 space-y-1.5 mt-2">
                    <li>• <strong>Ventaja:</strong> Excelente fluidez táctil y soporte iOS.</li>
                    <li>• <strong>Desventaja:</strong> Más costoso y limitado para conectar periféricos USB directos (requiere dongle USB-C).</li>
                    <li>• <strong>Costo estimado:</strong> $450 - $750 USD.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'button' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base">
                El Botón Físico "PUSH TO SPEAK" & Circuito de Conexión
              </h3>
              <p className="text-xs text-slate-300">
                El botón de la foto es un <strong>botón arcade iluminado tipo domo de 60mm o 100mm</strong> de uso rudo (soporta más de 1,000,000 de pulsaciones de clientes en tienda).
              </p>

              {/* Diagrama de conexión */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
                <p className="text-amber-400 font-bold mb-2">// DIAGRAMA DE CABLEADO SIMPLIFICADO PLUG & PLAY</p>
                <pre className="text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
{`+-------------------------------------------------------+
|  BOTÓN FÍSICO "PUSH TO SPEAK" (60mm o 100mm)         |
|  - Contacto NO (Normalmente Abierto)                 |
|  - Anillo LED Azul (12V DC)                          |
+------------+-----------------------------+-----------+
             | (2 cables de señal)         | (2 cables de poder)
             v                             v
+--------------------------+    +-----------------------+
| ZERO-DELAY USB ENCODER   |    | FUENTE DE PODER 12V   |
| (Placa USB de $10 USD)   |    | (Para iluminar anillo)|
| o Raspberry Pi Pico USB  |    +-----------------------+
+------------+-------------+
             | Cable USB estándar
             v
+-------------------------------------------------------+
| MINI PC / TABLET ANDROID                              |
| El navegador detecta el botón como una tecla común:   |
| (Ejemplo: Tecla 'ESPACIO' o 'ENTER').                 |
| En JavaScript: window.addEventListener('keydown', ...) |
+-------------------------------------------------------+`}
                </pre>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-200">
                <strong>¿Por qué esta solución es la mejor?</strong> No necesitas escribir drivers complicados. El encoder USB cuesta menos de $10 dólares, es plug & play y la página web del kiosco lo detecta al instante como si presionaran una tecla del teclado.
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base">Impresora Térmica & Módulo de Audio / Voz</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-amber-400 text-sm mb-1 flex items-center">
                    <i className="fa-solid fa-receipt mr-2"></i>
                    Impresora de Tickets Térmica
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Modelo Recomendado:</strong> Impresora de Kiosco 58mm o 80mm OEM (tipo CSN-A2 o Custom Engineering TG2480).</li>
                    <li>• <strong>Conexión:</strong> USB con cortador de papel automático (guillotina).</li>
                    <li>• <strong>Papel:</strong> Rollos térmicos estándar de bajo costo (los mismos que usa Coppel en cajas).</li>
                    <li>• <strong>Precio:</strong> $55 a $90 USD.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-cyan-400 text-sm mb-1 flex items-center">
                    <i className="fa-solid fa-microphone-lines mr-2"></i>
                    Micrófono & Altavoz "Push to Speak"
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Micrófono:</strong> USB tipo condensador omnidireccional con reducción de ruido ambiental de tienda.</li>
                    <li>• <strong>Bocinas:</strong> Par de altavoces de 5W empotrados detrás de una rejilla acústica metálica.</li>
                    <li>• <strong>Funcionamiento:</strong> Al oprimir el botón, se abre el canal de audio para hablar directamente con el asesor o centralita de piso.</li>
                    <li>• <strong>Precio:</strong> $25 a $40 USD.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment_hw' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base">Terminal de Pago Bancario, Lector EMV & Seguridad PCI-DSS</h3>
              <p className="text-xs text-slate-300">
                Para cobrar tarjetas de crédito/débito y abonos Coppel de forma legal y segura en el tótem físico, se utiliza una terminal certificada (PinPad) o un lector integrado:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-amber-400/40">
                  <h4 className="font-bold text-amber-400 text-sm mb-1 flex items-center">
                    <i className="fa-solid fa-credit-card mr-2"></i>
                    PinPad Empotrable (Verifone P400 / PAX Q30 / Lane 3000)
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Certificación:</strong> PCI-PTS 5.x y EMVCo Nivel 1 y 2 (cumple al 100% regulaciones CNBV y Visa/Mastercard).</li>
                    <li>• <strong>Lector:</strong> Chip con contacto (insertar), Banda Magnética y Antena NFC Contactless (Apple Pay, Google Pay).</li>
                    <li>• <strong>Conexión:</strong> USB o Ethernet directo a la Mini PC o Switch de tienda Coppel.</li>
                    <li>• <strong>Seguridad:</strong> Teclado físico blindado con cortinilla para ingreso de NIP sin miradas ajenas.</li>
                    <li>• <strong>Precio:</strong> $160 a $240 USD.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-cyan-400 text-sm mb-1 flex items-center">
                    <i className="fa-solid fa-mobile-screen mr-2"></i>
                    Autenticación 2FA & Token Móvil (Software)
                  </h4>
                  <ul className="space-y-1.5 text-slate-300">
                    <li>• <strong>Protocolo 3D Secure 2.0:</strong> La pasarela bancaria dispara un código dinámico de 6 dígitos (OTP) por SMS al celular del cliente o a su App BanCoppel.</li>
                    <li>• <strong>Teclado Táctil Cifrado (Scrambled PIN Pad):</strong> En la pantalla del tótem, los dígitos numéricos se ordenan aleatoriamente para evitar que alguien grabe o memorice la posición de los dedos.</li>
                    <li>• <strong>Impresión Inmediata:</strong> Al confirmar la transacción, la impresora térmica emite el ticket oficial con folio fiscal y código de barras.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-700 text-xs text-emerald-200">
                <i className="fa-solid fa-shield-check mr-2 text-emerald-400"></i>
                <strong>Cumplimiento de Privacidad:</strong> En ningún momento el software del quiosco guarda el NIP, contraseña o número completo de tarjeta en disco duro o memoria local. Todo se envía encriptado con tokenización bancaria.
              </div>
            </div>
          )}

          {activeTab === 'budget' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-white text-base">Presupuesto Estimado y Opciones Factibles</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800">
                  <thead className="bg-slate-950 text-amber-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Componente</th>
                      <th className="p-2.5">Opción Económica</th>
                      <th className="p-2.5">Opción Recomendada (Retail)</th>
                      <th className="p-2.5">Opción Industrial 24/7</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold">Pantalla + Cómputo</td>
                      <td className="p-2.5">Tablet Android 14" ($280 USD)</td>
                      <td className="p-2.5 text-amber-300 font-semibold">Touch 21.5" + Mini PC N100 ($390 USD)</td>
                      <td className="p-2.5">Panel PC All-In-One IP65 ($650 USD)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Botón Push to Speak</td>
                      <td className="p-2.5">Botón Domo 60mm + USB ($15 USD)</td>
                      <td className="p-2.5 text-amber-300 font-semibold">Botón 100mm LED + Zero-Delay ($20 USD)</td>
                      <td className="p-2.5">Botón Inox Antivandálico ($35 USD)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Impresora Térmica</td>
                      <td className="p-2.5">Módulo 58mm USB ($45 USD)</td>
                      <td className="p-2.5 text-amber-300 font-semibold">Módulo 80mm con guillotina ($85 USD)</td>
                      <td className="p-2.5">Epson TM-T88 Industrial ($170 USD)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Audio & Micrófono</td>
                      <td className="p-2.5">Micrófono USB + mini altavoz ($20 USD)</td>
                      <td className="p-2.5 text-amber-300 font-semibold">Kit intercomunicador con filtro ($35 USD)</td>
                      <td className="p-2.5">Intercom SIP Industrial ($90 USD)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Mueble / Tótem Azul</td>
                      <td className="p-2.5">MDF termoformado lacado ($140 USD)</td>
                      <td className="p-2.5 text-amber-300 font-semibold">Chapa de acero cal. 18 lacada ($220 USD)</td>
                      <td className="p-2.5">Acero reforzado cerradura ($350 USD)</td>
                    </tr>
                    <tr className="bg-slate-950/80 font-bold text-sm">
                      <td className="p-3 text-white">TOTAL ESTIMADO</td>
                      <td className="p-3 text-emerald-400">~$500 USD (~$9,500 MXN)</td>
                      <td className="p-3 text-amber-400">~$750 USD (~$14,250 MXN)</td>
                      <td className="p-3 text-blue-400">~$1,295 USD (~$24,600 MXN)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-400">
                * Precios estimados a mayoreo/proyectos en México. La <strong>Opción Recomendada (~$14,250 MXN)</strong> es la más costo-eficiente para instalar cientos de kioscos en sucursales Coppel manteniendo excelente durabilidad y presencia estética idéntica a tu render.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-500">
            Arquitectura de Hardware · Coppel Asistencia Kiosk Blueprint v1.0
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 bg-amber-400 hover:bg-amber-300 text-[#002B66] font-bold rounded-xl text-xs btn-motion shadow"
          >
            Cerrar Guía
          </button>
        </div>
      </div>
    </div>
  );
};
