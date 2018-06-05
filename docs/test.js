describe('imageRepository', function () {
  describe('.background', function () {
    it('src should include background.png', function () {
      chai.expect(imageRepository.background.src).to.include("background.png");
    });
  });
});
