
import React from 'react';

const TaxInfoPage: React.FC = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
      <h1 className="text-3xl font-semibold text-neutral-900 mb-6">Consideraciones Fiscales para Cestas y Regalos de Navidad</h1>
      <p className="mb-6 text-sm text-neutral-600 italic">
        La siguiente información se proporciona únicamente con fines informativos generales y no constituye asesoramiento fiscal. 
        Consulte siempre con un asesor fiscal cualificado para obtener asesoramiento adaptado a su situación específica.
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-primary-dark mb-2">IVA de Cestas y Regalos</h2>
          <p className="text-neutral-700 leading-relaxed">
            Generalmente, el IVA de las cestas y regalos de Navidad <strong className="text-red-600">no es deducible</strong>, ya que se consideran atenciones a clientes, empleados o terceros.
          </p>
          <p className="text-neutral-700 leading-relaxed mt-2">
            <strong>Excepción:</strong> Sí es deducible el IVA de las muestras gratuitas y objetos publicitarios de escaso valor (que no superen los 200 euros al año por destinatario) siempre que lleven visible el nombre de la empresa. Es aconsejable que la factura del proveedor refleje la serigrafía o el carácter publicitario.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-dark mb-2">Impuesto sobre Sociedades (IS) de Cestas y Regalos</h2>
          <p className="text-neutral-700 leading-relaxed">
            Los donativos y liberalidades <strong className="text-red-600">no son deducibles</strong> en el Impuesto sobre Sociedades.
          </p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-neutral-700">
            <li>
              <strong>Deducibilidad por "Costumbre":</strong> El gasto de las cestas y regalos de Navidad <strong className="text-green-600">sí es deducible</strong> en el IS si la empresa puede demostrar que es una "costumbre" o tradición de la empresa su entrega anual. Esto se prueba con facturas de años anteriores.
            </li>
            <li>
              <strong>Empresas de Nueva Creación:</strong> Para empresas de nueva creación, el gasto <strong className="text-red-600">no será deducible</strong> inicialmente, ya que no se puede demostrar que sea una costumbre hasta que transcurran unos dos años. Esto supone un riesgo fiscal y debe valorarse con un asesor.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-primary-dark mb-2">Tributación en Nóminas de los Trabajadores (IRPF)</h2>
          <p className="text-neutral-700 leading-relaxed">
            Las cestas y regalos de Navidad entregados a los empleados se consideran <strong className="text-orange-600">"retribuciones en especie" no exentas</strong>.
          </p>
          <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-neutral-700">
            <li>Deben incluirse en la nómina del trabajador y el empleador debe ingresar los correspondientes pagos a cuenta del IRPF (ingreso a cuenta) mediante el modelo 111.</li>
            <li>El importe de las cestas también se incluye en la base de cotización.</li>
            <li>Los trabajadores deben asegurarse de que se incluyan en su nómina y en el certificado de retenciones que la empresa les entrega para facilitar su declaración del IRPF.</li>
          </ul>
        </section>
      </div>
      <p className="mt-8 text-sm text-neutral-600 italic">
        Esta información está basada en la normativa fiscal española general y puede estar sujeta a cambios o interpretaciones específicas.
        Reiteramos la importancia de consultar con un asesor fiscal.
      </p>
    </div>
  );
};

export default TaxInfoPage;
    