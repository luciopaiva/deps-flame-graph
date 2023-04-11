
function generateFlameGraph(dependencyTree, containerSelector) {
    const container = d3.select(containerSelector);

    const chart = flamegraph()
        .width(800)
        .cellHeight(18)
        .sort(true)
        .title('NPM Dependency Tree')
        .tooltip(true);

    container.datum(dependencyTree).call(chart);
}
