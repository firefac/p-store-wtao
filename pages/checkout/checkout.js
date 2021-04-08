var util = require('../../utils/util.js');
var api = require('../../config/api.js');

var app = getApp();

Page({
  data: {
    checkedGoodsList: [],
    checkedAddress: {},
    availableCouponLength: 0, // 可用的优惠券数量
    goodsTotalPrice: 0.00, //商品总价
    freightPrice: 0.00, //快递费
    couponPrice: 0.00, //优惠券的价格
    grouponPrice: 0.00, //团购优惠价格
    orderTotalPrice: 0.00, //订单总价
    actualPrice: 0.00, //实际需要支付的总价
    cartId: 0,
    addressId: 0,
    couponId: 0,
    message: '',
    grouponLinkId: 0, //参与的团购，如果是发起则为0
    grouponRulesId: 0, //团购规则ID
    patchGrouponId: 0,
    patchGrouponInstId: 0,
    needRefresh: true,
    tmplIds: []
  },
  onLoad: function(options) {
    let that = this
    // 页面初始化 options为页面跳转所带来的参数
    util.request(api.MessageGroupTemplateList, {
      code: 'order'
    }).then(function(res) {
      if (res.errcode === '0') {
        var templateList = res.data.list
        if(templateList.length == 0){
          return
        }
        var tmplIds = [];
        for (let i = 0; i < templateList.length; i++) {
          tmplIds.push(templateList[i].templateId)
        }

        that.setData({
          tmplIds: tmplIds
        })
      }
    });
  },

  //获取checkou信息
  getCheckoutInfo: function() {
    let that = this;
    util.request(api.CartCheckout, {
      cartId: that.data.cartId,
      addressId: that.data.addressId,
      couponId: that.data.couponId,
      grouponRulesId: that.data.grouponRulesId,
      patchGrouponId: that.data.patchGrouponId,
      patchGrouponInstId: that.data.patchGrouponInstId
    }, "POST").then(function(res) {
      if (res.errcode === '0') {
        that.setData({
          checkedGoodsList: res.data.checkedGoodsList,
          checkedAddress: res.data.checkedAddress,
          availableCouponLength: res.data.availableCouponLength,
          actualPrice: res.data.actualPrice,
          couponPrice: res.data.couponPrice,
          grouponPrice: res.data.grouponPrice,
          freightPrice: res.data.freightPrice,
          goodsTotalPrice: res.data.goodsTotalPrice,
          orderTotalPrice: res.data.orderTotalPrice,
          addressId: res.data.addressId,
          couponId: res.data.couponId,
          grouponRulesId: res.data.grouponRulesId,
        });
      }else{
        wx.showModal({
          title: '错误信息',
          content: res.errmsg,
          showCancel: false,
          success (res) {
            wx.navigateBack({
              delta: 1
            })
          }
        });
      }
      wx.hideLoading();
    });
  },
  selectAddress() {
    wx.navigateTo({
      url: '/pages/ucenter/address/address',
    })
  },
  selectCoupon() {
    wx.navigateTo({
      url: '/pages/ucenter/couponSelect/couponSelect',
    })
  },
  bindMessageInput: function(e) {
    this.setData({
      message: e.detail.value
    });
  },
  onReady: function() {
    // 页面渲染完成

  },
  onShow: function() {
    if(!this.data.needRefresh){
      that.setData({
        needRefresh: true
      });
      return
    }
    // 页面显示
    wx.showLoading({
      title: '加载中...',
    });
    try {
      var cartId = wx.getStorageSync('cartId');
      if (cartId === "") {
        cartId = 0;
      }
      var addressId = wx.getStorageSync('addressId');
      if (addressId === "") {
        addressId = 0;
      }
      var couponId = wx.getStorageSync('couponId');
      if (couponId === "") {
        couponId = 0;
      }
      var grouponRulesId = wx.getStorageSync('grouponRulesId');
      if (grouponRulesId === "") {
        grouponRulesId = 0;
      }
      var grouponLinkId = wx.getStorageSync('grouponLinkId');
      if (grouponLinkId === "") {
        grouponLinkId = 0;
      }
      var patchGrouponId = wx.getStorageSync('patchGrouponId');
      if (patchGrouponId === "") {
        patchGrouponId = 0;
      }
      var patchGrouponInstId = wx.getStorageSync('patchGrouponInstId');
      if (patchGrouponInstId === "") {
        patchGrouponInstId = 0;
      }

      this.setData({
        cartId: cartId,
        addressId: addressId,
        couponId: couponId,
        grouponRulesId: grouponRulesId,
        grouponLinkId: grouponLinkId,
        patchGrouponId: patchGrouponId,
        patchGrouponInstId: patchGrouponInstId
      });

    } catch (e) {
      // Do something when catch error
      console.log(e);
    }

    this.getCheckoutInfo();
  },
  onHide: function() {
    // 页面隐藏

  },
  onUnload: function() {
    // 页面关闭

  },
  submitOrderWithSubscribe: function() {
    let that = this

    if(this.data.tmplIds.length == 0){
      that.submitOrder();
      return
    }

    wx.requestSubscribeMessage({
      tmplIds: this.data.tmplIds,
      success (res) {
        console.log('success' + res.errMsg);
        console.log('success' + res.TEMPLATE_ID);
        that.submitOrder();
      },
      fail (res) { 
        console.log('fail' + res.errMsg);
        console.log('success' + res.errCode);
        that.submitOrder();
      }
    })
  },
  submitOrder: function() {
    let that = this
    if (this.data.addressId <= 0) {
      util.showErrorToast('请选择收货地址');
      return false;
    }
    util.request(api.OrderSubmit, {
      cartId: this.data.cartId,
      addressId: this.data.addressId,
      couponId: this.data.couponId,
      message: this.data.message,
      grouponRulesId: this.data.grouponRulesId,
      grouponLinkId: this.data.grouponLinkId,
      patchGrouponId: this.data.patchGrouponId,
      patchGrouponInstId: this.data.patchGrouponInstId
    }, 'POST').then(res => {
      if (res.errcode === '0') {
        
        // 下单成功，重置couponId
        try {
          wx.setStorageSync('couponId', 0);
          wx.setStorageSync('patchGrouponId', 0);
          wx.setStorageSync('patchGrouponInstId', 0);
        } catch (error) {

        }

        const orderId = res.data.orderId;
        util.request(api.OrderPrepay, {
          orderId: orderId
        }, 'POST').then(function(res) {
          if (res.errcode === '0') {
            const payParam = res.data;
            console.log("支付过程开始");
            that.setData({
              needRefresh: false
            });
            wx.requestPayment({
              'timeStamp': payParam.timeStamp,
              'nonceStr': payParam.nonceStr,
              'package': payParam.packageValue,
              'signType': payParam.signType,
              'paySign': payParam.paySign,
              'success': function(res) {
                console.log("支付过程成功");
                wx.redirectTo({
                  url: '/pages/payResult/payResult?status=1&orderId=' + orderId
                });
              },
              'fail': function(res) {
                console.log("支付过程失败");
                wx.redirectTo({
                  url: '/pages/payResult/payResult?status=0&orderId=' + orderId
                });
              },
              'complete': function(res) {
                console.log("支付过程结束")
              }
            });
          } else {
            wx.redirectTo({
              url: '/pages/payResult/payResult?status=0&orderId=' + orderId
            });
          }
        });

      } else {
        wx.showToast({
          title: res.errmsg,
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});