exports.up = async function up(knex){
    return knex.schema.createTable('photos', table => {
        table.increments('id').primary();
        table.string('url').notNullable();
        table.string('tags').notNullable();
    });
}

exports.down = async function down(knex) {
    return knex.schema.dropTable('users');
}