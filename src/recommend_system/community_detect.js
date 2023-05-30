const fs = require('fs');
const csv = require('csv-parser');
const Graph = require('graphology');
const louvain = require('graphology-communities-louvain');
const { finished } = require('stream/promises');
const { mod } = require('@tensorflow/tfjs-node');

class GraphConverter {
  constructor() {
    this.node_data = [];
    this.edge_data = [];
  }

  async convertCSVToGraphData(csvFilePath) {
    const stream = fs.createReadStream(csvFilePath).pipe(csv());
    stream.on('data', (row) => {
      const { UserID, SocialLinks } = row;

      // Tạo node dựa trên UserID
      this.node_data.push(UserID);

      // Xử lý SocialLinks để tạo các edge
      if (SocialLinks !== 'NULL') {
        const links = SocialLinks.split(',');
        links.forEach((link) => {
          const edge = {
            source: UserID,
            target: link.trim(),
            weight: 1.0, // Giá trị mặc định cho trọng số
          };
          this.edge_data.push(edge);
        });
      }
    });

    await finished(stream);
  }

  async runCommunityDetection() {
    let graph = new Graph();

    // Add nodes
    this.node_data.forEach(node => {
        graph.addNode(node);
    });

    // Add edges
    this.edge_data.forEach(edge => {
        graph.addEdge(edge.source, edge.target, { weight: edge.weight });
    });

    // Để lấy phân cắt cộng đồng
    const communities = await louvain(graph);

    // Để gán trực tiếp cộng đồng làm thuộc tính nút
    louvain.assign(graph);

    // Nếu bạn cần truyền tùy chọn tùy chỉnh
    louvain.assign(graph, {
        resolution: 0.8
    });

    // Nếu bạn muốn trả về một số chi tiết về việc thực hiện thuật toán
    var details = await louvain.detailed(graph);

    // Nếu bạn muốn bỏ qua trọng số của đồ thị của bạn
    louvain.assign(graph, {getEdgeWeight: null});
    return details;
  }
}

module.exports = GraphConverter;
