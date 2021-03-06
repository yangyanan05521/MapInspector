/**
 * @description
 * @file
 * @author    lingLing
 * @date      2017/11/20
 *
 * @copyright @Navinfo, all rights reserved.
 */
const async = require ('async');
const sequelize = require ("../dataBase");
// 用户关系表;
const userModel = sequelize.import ("./om/userModel");
const roleModel = sequelize.import ("./om/roleModel");
const userRoleModel = sequelize.import ("./om/user_roleModel");
// 业务表;
const caseModel = sequelize.import ("./bs/caseModel");
const projectModel = sequelize.import ("./bs/projectModel");
const issueModel = sequelize.import ("./bs/issueModel");

// 设置用户角色的关系(n:m);
userModel.belongsToMany (roleModel, { through: userRoleModel, foreignKey: 'userId', targetKey: 'roleId'});
roleModel.belongsToMany (userModel, { through: userRoleModel, foreignKey: 'roleId', targetKey: 'userId'});

// 设置用户和案例的关系(1:m);
userModel.hasMany (caseModel, {foreignKey: 'createUser'});
// 设置用户和项目的关系(1:m);
userModel.hasMany (projectModel, {as: 'pojectUser', foreignKey: 'createUser'});
projectModel.belongsTo (userModel, {as: 'pojectUser', foreignKey: 'createUser'});

// 设置问题表（案例和项目n:m产生的表);
caseModel.belongsToMany (projectModel, {through: issueModel, foreignKey: 'caseCode'});
projectModel.belongsToMany (caseModel, {through: issueModel, foreignKey: 'proCode'});
// 设置用户和问题表的关联关系;
userModel.hasMany (issueModel, {foreignKey: 'createUser'});
issueModel.belongsTo (userModel, {foreignKey: 'createUser'});


let allModel = [userModel, roleModel, userRoleModel, caseModel, projectModel, issueModel];
async.each(allModel, (item,callback) => {
  item.sync ({force: false})
  .then(result => {
    callback(null);
  })
  .catch(err => {
    callback(err);
  })
}, (err) => {
  roleModel.count ()
  .then(count => {
    if (!count) {
      async.parallel ([
        function (callback) {
          return roleModel.bulkCreate ([
            {roleCode: 0, roleName: '游客', roleDesc: '只能看'},
            {roleCode: 1, roleName: '作业员', roleDesc: '维护创建的项目'},
            {roleCode: 2, roleName: '管理员', roleDesc: '维护创建的案例'},
            {roleCode: 3, roleName: '超级管理员', roleDesc: '用户管理'}
          ]).then(result => {
            callback(null, result);
          })
        },
        function (callback) {
          return userModel.bulkCreate ([
            {
              userName: 'root',
              email: 'mapaudit@navinfo.com',
              fullName: '超级管理员',
              status: 1,
              password: '40bd001563085fc35165329ea1ff5c5ecbdbbeef'
            }
          ]).then(result => {
            callback(null, result);
          });
        }
      ], (err) => {
        if (err) throw err;
        return userRoleModel.bulkCreate([
          {userId: 1, roleId: 4}
        ]);
      });
    }
  })
  .catch(err => {
    throw err;
  })
});
