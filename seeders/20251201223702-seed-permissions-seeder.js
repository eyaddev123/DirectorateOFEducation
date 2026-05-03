module.exports = {
up: async (queryInterface) => {
const perms = [
'admin_register_employee',
'TYPETPROCESS_CREATE',
'TYPETPROCESS_UPDATE',
'TYPETPROCESS_VIEW',
'ORGANIZATION_CREATE',
'ORGANIZATION_UPDATE',
'ORGANIZATION_DELETE',
'ORGANIZATION_VIEW',
'DEPARTMENT_CREATE',
'DEPARTMENT_UPDATE',
'DEPARTMENT_DELETE',
'DEPARTMENT_VIEW',

];


await queryInterface.bulkInsert('permissions', perms.map(p => ({ name: p, created_at: new Date(), updated_at: new Date() })), {});
},
down: async (queryInterface) => {
await queryInterface.bulkDelete('permissions', null, {});
}
};